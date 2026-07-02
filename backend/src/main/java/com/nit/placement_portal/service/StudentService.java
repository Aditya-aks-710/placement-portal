package com.nit.placement_portal.service;

import com.nit.placement_portal.data.MockStudentsData;
import com.nit.placement_portal.dto.CompanyDTO;
import com.nit.placement_portal.dto.EducationDTO;
import com.nit.placement_portal.dto.PositionDTO;
import com.nit.placement_portal.dto.PublicInterviewExperienceDTO;
import com.nit.placement_portal.dto.PublicInterviewRoundDTO;
import com.nit.placement_portal.dto.PublicStudentDTO;
import com.nit.placement_portal.dto.PublicStudentFilterOptionsDTO;
import com.nit.placement_portal.dto.PublicStudentPageDTO;
import com.nit.placement_portal.exception.ResourceNotFoundException;
import com.nit.placement_portal.model.Company;
import com.nit.placement_portal.model.Education;
import com.nit.placement_portal.model.InterviewExperience;
import com.nit.placement_portal.model.InterviewQuestion;
import com.nit.placement_portal.model.InterviewRound;
import com.nit.placement_portal.model.Skill;
import com.nit.placement_portal.model.Student;
import com.nit.placement_portal.model.StudentCompany;
import com.nit.placement_portal.model.StudentPlacement;
import com.nit.placement_portal.repository.CompanyRepository;
import com.nit.placement_portal.repository.EducationRepository;
import com.nit.placement_portal.repository.InterviewExperienceRepository;
import com.nit.placement_portal.repository.SkillRepository;
import com.nit.placement_portal.repository.StudentCompanyRepository;
import com.nit.placement_portal.repository.StudentPlacementRepository;
import com.nit.placement_portal.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StudentService {

    private static final Pattern BATCH_PATTERN = Pattern.compile("^(\\d{4})");

    private final StudentRepository studentRepository;
    private final StudentCompanyRepository studentCompanyRepository;
    private final StudentPlacementRepository studentPlacementRepository;
    private final SkillRepository skillRepository;
    private final EducationRepository educationRepository;
    private final InterviewExperienceRepository interviewExperienceRepository;
    private final CompanyRepository companyRepository;
    private final Map<String, MockStudentsData.StudentData> mockStudentsByName;

    public StudentService(
            StudentRepository studentRepository,
            StudentCompanyRepository studentCompanyRepository,
            StudentPlacementRepository studentPlacementRepository,
            SkillRepository skillRepository,
            EducationRepository educationRepository,
            InterviewExperienceRepository interviewExperienceRepository,
            CompanyRepository companyRepository
    ) {
        this.studentRepository = studentRepository;
        this.studentCompanyRepository = studentCompanyRepository;
        this.studentPlacementRepository = studentPlacementRepository;
        this.skillRepository = skillRepository;
        this.educationRepository = educationRepository;
        this.interviewExperienceRepository = interviewExperienceRepository;
        this.companyRepository = companyRepository;
        this.mockStudentsByName = buildMockStudentLookup();
    }

    public List<PublicStudentDTO> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        RelatedStudentData relatedStudentData = loadRelatedStudentData(students);
        return students.stream()
                .map(student -> toPublicStudent(student, relatedStudentData))
                .toList();
    }

    public PublicStudentPageDTO getStudentsPage(
            int page,
            int size,
            String search,
            String status,
            String company,
            String branch,
            String batch
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        String normalizedSearch = normalizeFilterValue(search);
        String normalizedStatus = normalizeOptionalStatus(status);
        String normalizedCompany = normalizeFilterValue(company);
        String normalizedBranch = normalizeFilterValue(branch);
        String normalizedBatch = normalizeFilterValue(batch);

        Set<String> matchingSkillStudentIds = normalizedSearch == null
                ? Set.of()
                : findMatchingSkillStudentIds(normalizedSearch);

        List<Student> matchedStudents = studentRepository.findAll().stream()
                .filter(student -> matchesFilters(
                        student,
                        normalizedSearch,
                        normalizedStatus,
                        normalizedCompany,
                        normalizedBranch,
                        normalizedBatch,
                        matchingSkillStudentIds
                ))
                .sorted(Comparator.comparing(
                        student -> defaultString(student.getName(), student.getRegNo(), student.getId(), ""),
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();

        int total = matchedStudents.size();
        int fromIndex = Math.min(safePage * safeSize, total);
        int toIndex = Math.min(fromIndex + safeSize, total);
        List<Student> pageStudents = matchedStudents.subList(fromIndex, toIndex);
        RelatedStudentData relatedStudentData = loadRelatedStudentData(pageStudents);

        PublicStudentPageDTO dto = new PublicStudentPageDTO();
        dto.setStudents(pageStudents.stream()
                .map(student -> toPublicStudent(student, relatedStudentData))
                .toList());
        dto.setTotal(total);
        dto.setPage(safePage);
        dto.setSize(safeSize);
        dto.setHasMore(toIndex < total);
        dto.setPlacedCount(countByStatus(matchedStudents, "PLACED"));
        dto.setUnplacedCount(countByStatus(matchedStudents, "UNPLACED"));
        dto.setInternshipCount(countByStatus(matchedStudents, "INTERNSHIP"));
        dto.setPendingCount(countByStatus(matchedStudents, "PENDING"));
        return dto;
    }

    public PublicStudentFilterOptionsDTO getStudentFilterOptions() {
        List<Student> students = studentRepository.findAll();
        Set<String> companies = new LinkedHashSet<>();
        Set<String> branches = new LinkedHashSet<>();
        Set<String> batches = new LinkedHashSet<>();

        for (Student student : students) {
            MockStudentsData.StudentData mock = findMockStudent(student);
            addIfPresent(companies, defaultString(student.getCompany(), safe(() -> mock.currentCompany.name), null));
            addIfPresent(branches, defaultString(student.getBranch(), safe(() -> mock.branch), "Unknown"));
            addIfPresent(batches, resolveBatch(student.getRegNo(), safe(() -> mock.batch)));
        }

        PublicStudentFilterOptionsDTO dto = new PublicStudentFilterOptionsDTO();
        dto.setCompanies(companies.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList());
        dto.setBranches(branches.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList());
        dto.setBatches(batches.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList());
        return dto;
    }

    public Student markStudentPending(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student Not Found"));

        student.setStatus("PENDING");
        return studentRepository.save(student);
    }

    public List<PublicStudentDTO> getStudentsByStatus(String status) {
        String normalizedFilter = normalizeStatus(status);

        List<Student> matched = studentRepository.findAll().stream()
                .filter(student -> normalizeStatus(student.getStatus()).equals(normalizedFilter))
                .toList();
        RelatedStudentData relatedStudentData = loadRelatedStudentData(matched);
        return matched.stream()
                .map(student -> toPublicStudent(student, relatedStudentData))
                .toList();
    }

    private PublicStudentDTO toPublicStudent(Student student) {
        MockStudentsData.StudentData mock = findMockStudent(student);

        List<StudentCompany> studentCompanies = studentCompanyRepository.findByStudentId(student.getId());
        List<StudentPlacement> placements = studentPlacementRepository.findByStudentId(student.getId());
        List<Skill> skills = skillRepository.findByStudentId(student.getId());
        List<Education> educations = educationRepository.findByStudentId(student.getId());
        List<InterviewExperience> experiences = interviewExperienceRepository.findByStudentId(student.getId());

        CompanyDTO currentCompany = resolveCurrentCompany(student, studentCompanies, placements, mock);
        List<CompanyDTO> pastCompanies = resolvePastCompanies(studentCompanies, currentCompany, mock);
        List<String> skillNames = resolveSkills(skills, mock);
        List<EducationDTO> education = resolveEducation(educations, mock);
        List<PublicInterviewExperienceDTO> interviewExperiences = resolveInterviewExperiences(experiences, mock);

        PublicStudentDTO dto = new PublicStudentDTO();
        dto.setId(student.getId());
        dto.setRegNo(student.getRegNo());
        dto.setName(defaultString(student.getName(), safe(() -> mock.name)));
        dto.setBranch(defaultString(student.getBranch(), safe(() -> mock.branch), "Unknown"));
        dto.setStatus(normalizeStatus(defaultString(student.getStatus(), safe(() -> mock.status))));
        dto.setBatch(resolveBatch(student.getRegNo(), safe(() -> mock.batch)));

        dto.setEmail(defaultString(safe(() -> mock.email), ""));
        dto.setPhone(defaultString(safe(() -> mock.phone), ""));
        dto.setAvatar(defaultString(safe(() -> mock.avatar), student.getProfilePic(), ""));
        dto.setProfilePic(defaultString(student.getProfilePic(), safe(() -> mock.avatar), null));

        dto.setCurrentCompany(currentCompany);
        dto.setPastCompanies(pastCompanies);
        dto.setSkills(skillNames);
        dto.setEducation(education);
        dto.setInterviewExperiences(interviewExperiences);

        dto.setLinkedin(defaultString(safe(() -> mock.linkedin), null));
        dto.setGithub(defaultString(safe(() -> mock.github), null));
        dto.setBio(defaultString(safe(() -> mock.bio), ""));

        dto.setCompany(defaultString(
                currentCompany != null ? currentCompany.getName() : null,
                student.getCompany(),
                null
        ));
        dto.setCompanyLogo(defaultString(
                currentCompany != null ? currentCompany.getLogo() : null,
                student.getCompanyLogo(),
                null
        ));
        dto.setRole(defaultString(currentCompany != null ? currentCompany.getRole() : null, null));
        dto.setPackageValue(defaultString(currentCompany != null ? currentCompany.getPackageValue() : null, null));
        dto.setJoinDate(defaultString(currentCompany != null ? currentCompany.getJoinDate() : null, null));
        dto.setEndDate(defaultString(currentCompany != null ? currentCompany.getEndDate() : null, null));
        dto.setType(defaultString(currentCompany != null ? currentCompany.getType() : null, null));
        dto.setDuration(defaultString(currentCompany != null ? currentCompany.getDuration() : null, null));

        return dto;
    }

    private PublicStudentDTO toPublicStudent(Student student, RelatedStudentData relatedStudentData) {
        MockStudentsData.StudentData mock = findMockStudent(student);
        List<StudentCompany> studentCompanies = relatedStudentData.studentCompaniesByStudentId
                .getOrDefault(student.getId(), List.of());
        List<StudentPlacement> placements = relatedStudentData.placementsByStudentId
                .getOrDefault(student.getId(), List.of());
        List<Skill> skills = relatedStudentData.skillsByStudentId
                .getOrDefault(student.getId(), List.of());
        List<Education> educations = relatedStudentData.educationsByStudentId
                .getOrDefault(student.getId(), List.of());
        List<InterviewExperience> experiences = relatedStudentData.interviewExperiencesByStudentId
                .getOrDefault(student.getId(), List.of());

        CompanyDTO currentCompany = resolveCurrentCompany(student, studentCompanies, placements, mock, relatedStudentData.companyById);
        List<CompanyDTO> pastCompanies = resolvePastCompanies(studentCompanies, currentCompany, mock, relatedStudentData.companyById);
        List<String> skillNames = resolveSkills(skills, mock);
        List<EducationDTO> education = resolveEducation(educations, mock);
        List<PublicInterviewExperienceDTO> interviewExperiences = resolveInterviewExperiences(experiences, mock);

        PublicStudentDTO dto = new PublicStudentDTO();
        dto.setId(student.getId());
        dto.setRegNo(student.getRegNo());
        dto.setName(defaultString(student.getName(), safe(() -> mock.name)));
        dto.setBranch(defaultString(student.getBranch(), safe(() -> mock.branch), "Unknown"));
        dto.setStatus(normalizeStatus(defaultString(student.getStatus(), safe(() -> mock.status))));
        dto.setBatch(resolveBatch(student.getRegNo(), safe(() -> mock.batch)));
        dto.setEmail(defaultString(safe(() -> mock.email), ""));
        dto.setPhone(defaultString(safe(() -> mock.phone), ""));
        dto.setAvatar(defaultString(safe(() -> mock.avatar), student.getProfilePic(), ""));
        dto.setProfilePic(defaultString(student.getProfilePic(), safe(() -> mock.avatar), null));
        dto.setCurrentCompany(currentCompany);
        dto.setPastCompanies(pastCompanies);
        dto.setSkills(skillNames);
        dto.setEducation(education);
        dto.setInterviewExperiences(interviewExperiences);
        dto.setLinkedin(defaultString(safe(() -> mock.linkedin), null));
        dto.setGithub(defaultString(safe(() -> mock.github), null));
        dto.setBio(defaultString(safe(() -> mock.bio), ""));
        dto.setCompany(defaultString(
                currentCompany != null ? currentCompany.getName() : null,
                student.getCompany(),
                null
        ));
        dto.setCompanyLogo(defaultString(
                currentCompany != null ? currentCompany.getLogo() : null,
                student.getCompanyLogo(),
                null
        ));
        dto.setRole(defaultString(currentCompany != null ? currentCompany.getRole() : null, null));
        dto.setPackageValue(defaultString(currentCompany != null ? currentCompany.getPackageValue() : null, null));
        dto.setJoinDate(defaultString(currentCompany != null ? currentCompany.getJoinDate() : null, null));
        dto.setEndDate(defaultString(currentCompany != null ? currentCompany.getEndDate() : null, null));
        dto.setType(defaultString(currentCompany != null ? currentCompany.getType() : null, null));
        dto.setDuration(defaultString(currentCompany != null ? currentCompany.getDuration() : null, null));
        return dto;
    }

    private CompanyDTO resolveCurrentCompany(
            Student student,
            List<StudentCompany> studentCompanies,
            List<StudentPlacement> placements,
            MockStudentsData.StudentData mock
    ) {
        return resolveCurrentCompany(student, studentCompanies, placements, mock, Map.of());
    }

    private CompanyDTO resolveCurrentCompany(
            Student student,
            List<StudentCompany> studentCompanies,
            List<StudentPlacement> placements,
            MockStudentsData.StudentData mock,
            Map<String, Company> companyById
    ) {
        CompanyDTO current = null;

        Optional<StudentCompany> currentRecord = studentCompanies.stream()
                .filter(company -> isBlank(company.getEndDate()))
                .findFirst();
        Optional<StudentCompany> convertedRecord = studentCompanies.stream()
                .filter(this::isConvertedCompany)
                .findFirst();

        if (currentRecord.isPresent()) {
            current = toCompanyDTO(currentRecord.get(), companyById);
        } else if (convertedRecord.isPresent()) {
            current = toCompanyDTO(convertedRecord.get(), companyById);
        } else if (!studentCompanies.isEmpty()) {
            current = toCompanyDTO(studentCompanies.get(0), companyById);
        } else if (!placements.isEmpty()) {
            current = toCompanyDTO(placements.get(0));
        } else if (safe(() -> mock.currentCompany) != null) {
            current = toCompanyDTO(mock.currentCompany);
        }

        if (current == null && !isBlank(student.getCompany())) {
            current = new CompanyDTO();
            current.setName(student.getCompany());
            current.setLogo(student.getCompanyLogo());
        }

        if (current != null) {
            current.setName(defaultString(current.getName(), student.getCompany(), null));
            current.setLogo(defaultString(current.getLogo(), student.getCompanyLogo(), null));
            current.setType(defaultString(current.getType(), inferCompanyType(student.getStatus()), "full-time"));
        }

        return current;
    }

    private List<CompanyDTO> resolvePastCompanies(
            List<StudentCompany> studentCompanies,
            CompanyDTO currentCompany,
            MockStudentsData.StudentData mock
    ) {
        return resolvePastCompanies(studentCompanies, currentCompany, mock, Map.of());
    }

    private List<CompanyDTO> resolvePastCompanies(
            List<StudentCompany> studentCompanies,
            CompanyDTO currentCompany,
            MockStudentsData.StudentData mock,
            Map<String, Company> companyById
    ) {
        List<CompanyDTO> past = new ArrayList<>();

        for (StudentCompany studentCompany : studentCompanies) {
            if (!isBlank(studentCompany.getEndDate())) {
                past.add(toCompanyDTO(studentCompany, companyById));
            }
        }

        if (past.isEmpty() && safe(() -> mock.pastCompanies) != null) {
            for (MockStudentsData.CompanyData companyData : mock.pastCompanies) {
                past.add(toCompanyDTO(companyData));
            }
        }

        if (currentCompany != null) {
            past.removeIf(company -> sameCompany(company, currentCompany));
        }

        return past;
    }

    private List<String> resolveSkills(List<Skill> skills, MockStudentsData.StudentData mock) {
        List<String> result = skills.stream()
                .map(Skill::getName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();

        if (!result.isEmpty()) {
            return result;
        }

        if (safe(() -> mock.skills) != null) {
            return mock.skills;
        }

        return List.of();
    }

    private List<EducationDTO> resolveEducation(List<Education> educations, MockStudentsData.StudentData mock) {
        List<EducationDTO> result = educations.stream()
                .map(this::toEducationDTO)
                .toList();

        if (!result.isEmpty()) {
            return result;
        }

        if (safe(() -> mock.education) != null) {
            return mock.education.stream()
                    .map(this::toEducationDTO)
                    .toList();
        }

        return List.of();
    }

    private List<PublicInterviewExperienceDTO> resolveInterviewExperiences(
            List<InterviewExperience> experiences,
            MockStudentsData.StudentData mock
    ) {
        List<PublicInterviewExperienceDTO> result = experiences.stream()
                .map(this::toInterviewExperienceDTO)
                .toList();

        if (!result.isEmpty()) {
            return result;
        }

        if (safe(() -> mock.interviewExperiences) != null) {
            return mock.interviewExperiences.stream()
                    .map(this::toInterviewExperienceDTO)
                    .toList();
        }

        return List.of();
    }

    private CompanyDTO toCompanyDTO(StudentCompany studentCompany) {
        return toCompanyDTO(studentCompany, Map.of());
    }

    private CompanyDTO toCompanyDTO(StudentCompany studentCompany, Map<String, Company> companyById) {
        CompanyDTO dto = new CompanyDTO();
        Company company = resolveCompany(studentCompany.getCompanyId(), companyById);

        String effectivePackage = resolveEffectivePackage(studentCompany);
        dto.setId(studentCompany.getId());
        dto.setName(company != null ? company.getName() : null);
        dto.setLogo(company != null ? company.getLogoUrl() : null);
        dto.setRole(studentCompany.getRole());
        dto.setPackageValue(effectivePackage);
        dto.setInternshipStipend(studentCompany.getInternshipStipend());
        dto.setFullTimePackage(studentCompany.getFullTimePackage());
        dto.setConverted(studentCompany.getConverted());
        dto.setConversionType(studentCompany.getConversionType());
        dto.setConversionDate(studentCompany.getConversionDate());
        dto.setJoinDate(studentCompany.getJoinDate());
        dto.setEndDate(studentCompany.getEndDate());
        dto.setType(studentCompany.getType());
        dto.setDuration(studentCompany.getDuration());
        dto.setPositions(PositionDTO.deriveFrom(studentCompany));
        return dto;
    }

    private CompanyDTO toCompanyDTO(StudentPlacement placement) {
        CompanyDTO dto = new CompanyDTO();
        dto.setName(placement.getCompany());
        dto.setLogo(placement.getCompanyLogo());
        dto.setRole(placement.getRole());
        dto.setPackageValue(formatCtc(placement.getCtc()));
        dto.setType(inferPlacementType(placement.getPlacementNature()));
        dto.setJoinDate(String.valueOf(placement.getPlacementYear()));
        return dto;
    }

    private CompanyDTO toCompanyDTO(MockStudentsData.CompanyData companyData) {
        CompanyDTO dto = new CompanyDTO();
        dto.setName(companyData.name);
        dto.setRole(companyData.role);
        dto.setPackageValue(companyData.packageValue);
        dto.setJoinDate(companyData.joinDate);
        dto.setEndDate(companyData.endDate);
        dto.setType(companyData.type);
        dto.setDuration(companyData.duration);
        return dto;
    }

    private EducationDTO toEducationDTO(Education education) {
        EducationDTO dto = new EducationDTO();
        dto.setId(education.getId());
        dto.setDegree(education.getDegree());
        dto.setInstitution(education.getInstitution());
        dto.setYear(education.getYear());
        dto.setGrade(education.getGrade());
        return dto;
    }

    private EducationDTO toEducationDTO(MockStudentsData.EducationData educationData) {
        EducationDTO dto = new EducationDTO();
        dto.setDegree(educationData.degree);
        dto.setInstitution(educationData.institution);
        dto.setYear(educationData.year);
        dto.setGrade(educationData.grade);
        return dto;
    }

    private PublicInterviewExperienceDTO toInterviewExperienceDTO(InterviewExperience experience) {
        PublicInterviewExperienceDTO dto = new PublicInterviewExperienceDTO();
        dto.setCompany(experience.getCompanyName());
        dto.setOverallTips(experience.getOverallTips());
        dto.setDifficulty(experience.getDifficulty());
        dto.setRating(experience.getRating() == null ? null : Math.round(experience.getRating()));
        dto.setPlacedHere(experience.getPlacedHere());

        List<PublicInterviewRoundDTO> rounds = new ArrayList<>();
        if (experience.getRounds() != null) {
            for (InterviewRound round : experience.getRounds()) {
                rounds.add(toInterviewRoundDTO(round));
            }
        }
        dto.setRounds(rounds);
        return dto;
    }

    private PublicInterviewExperienceDTO toInterviewExperienceDTO(MockStudentsData.InterviewExperienceData experienceData) {
        PublicInterviewExperienceDTO dto = new PublicInterviewExperienceDTO();
        dto.setCompany(experienceData.company);
        dto.setOverallTips(experienceData.overallTips);
        dto.setDifficulty(experienceData.difficulty);
        dto.setRating(experienceData.rating);

        List<PublicInterviewRoundDTO> rounds = new ArrayList<>();
        if (experienceData.rounds != null) {
            for (MockStudentsData.InterviewRoundData roundData : experienceData.rounds) {
                PublicInterviewRoundDTO round = new PublicInterviewRoundDTO();
                round.setName(roundData.name);
                round.setDescription(roundData.description);
                round.setTips(roundData.tips);
                rounds.add(round);
            }
        }
        dto.setRounds(rounds);
        return dto;
    }

    private PublicInterviewRoundDTO toInterviewRoundDTO(InterviewRound round) {
        PublicInterviewRoundDTO dto = new PublicInterviewRoundDTO();
        dto.setName(defaultString(round.getRoundType(), "Interview Round"));

        String description = defaultString(round.getMonth(), "Details not available.");
        String tips = defaultString(round.getYear(), resolveTips(round.getQuestions()));

        dto.setDescription(description);
        dto.setTips(tips);
        return dto;
    }

    private String resolveTips(List<InterviewQuestion> questions) {
        if (questions == null || questions.isEmpty()) {
            return "Prepare fundamentals and communicate your approach clearly.";
        }

        InterviewQuestion first = questions.get(0);
        if (!isBlank(first.getQuestion())) {
            return first.getQuestion();
        }

        if (!isBlank(first.getLink())) {
            return "Practice from: " + first.getLink();
        }

        return "Prepare fundamentals and communicate your approach clearly.";
    }

    private Company resolveCompany(String companyId) {
        return resolveCompany(companyId, Map.of());
    }

    private Company resolveCompany(String companyId, Map<String, Company> companyById) {
        if (isBlank(companyId)) {
            return null;
        }
        if (companyById.containsKey(companyId)) {
            return companyById.get(companyId);
        }
        return companyRepository.findById(companyId).orElse(null);
    }

    private boolean sameCompany(CompanyDTO a, CompanyDTO b) {
        return equalsIgnoreCase(a.getName(), b.getName())
                && equalsIgnoreCase(a.getRole(), b.getRole())
                && equalsIgnoreCase(a.getJoinDate(), b.getJoinDate());
    }

    private String resolveBatch(String regNo, String mockBatch) {
        if (!isBlank(mockBatch)) {
            return mockBatch;
        }

        if (isBlank(regNo)) {
            return "Unknown";
        }

        Matcher matcher = BATCH_PATTERN.matcher(regNo.trim());
        if (matcher.find()) {
            return matcher.group(1);
        }

        return "Unknown";
    }

    private String formatCtc(double ctc) {
        if (ctc <= 0) {
            return null;
        }
        if (ctc >= 1) {
            return String.format(Locale.ROOT, "%.1f LPA", ctc);
        }
        return String.format(Locale.ROOT, "%.0f K", ctc * 100);
    }

    private String inferPlacementType(String placementNature) {
        String normalized = normalizeStatus(placementNature);
        if ("INTERNSHIP".equals(normalized)) {
            return "internship";
        }
        return "full-time";
    }

    private String inferCompanyType(String status) {
        String normalized = normalizeStatus(status);
        if ("INTERNSHIP".equals(normalized)) {
            return "internship";
        }
        return "full-time";
    }

    private boolean isConvertedCompany(StudentCompany studentCompany) {
        return Boolean.TRUE.equals(studentCompany.getConverted())
                || !isBlank(studentCompany.getFullTimePackage());
    }

    private String resolveEffectivePackage(StudentCompany studentCompany) {
        if ("internship".equalsIgnoreCase(studentCompany.getType()) && !isConvertedCompany(studentCompany)) {
            return defaultString(
                    studentCompany.getInternshipStipend(),
                    studentCompany.getPackageValue()
            );
        }

        if (isConvertedCompany(studentCompany)) {
            return defaultString(
                    studentCompany.getFullTimePackage(),
                    studentCompany.getPackageValue(),
                    studentCompany.getInternshipStipend()
            );
        }

        return defaultString(
                studentCompany.getPackageValue(),
                studentCompany.getFullTimePackage(),
                studentCompany.getInternshipStipend()
        );
    }

    private String normalizeStatus(String status) {
        if (isBlank(status)) {
            return "UNPLACED";
        }

        String value = status.trim().toUpperCase(Locale.ROOT);
        if ("PLACE".equals(value)) {
            return "PLACED";
        }
        if ("INTERN".equals(value)) {
            return "INTERNSHIP";
        }
        return value;
    }

    private Map<String, MockStudentsData.StudentData> buildMockStudentLookup() {
        Map<String, MockStudentsData.StudentData> lookup = new LinkedHashMap<>();

        for (MockStudentsData.StudentData studentData : Arrays.asList(MockStudentsData.getMockStudents())) {
            if (studentData == null || isBlank(studentData.name)) {
                continue;
            }
            lookup.put(normalizeKey(studentData.name), studentData);
        }

        return lookup;
    }

    private MockStudentsData.StudentData findMockStudent(Student student) {
        if (student == null || isBlank(student.getName())) {
            return null;
        }
        return mockStudentsByName.get(normalizeKey(student.getName()));
    }

    private String normalizeKey(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeFilterValue(String value) {
        if (isBlank(value) || "all".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return value.trim();
    }

    private String normalizeOptionalStatus(String status) {
        String normalized = normalizeFilterValue(status);
        return normalized == null ? null : normalizeStatus(normalized);
    }

    private Set<String> findMatchingSkillStudentIds(String search) {
        String normalizedSearch = search.toLowerCase(Locale.ROOT);
        return skillRepository.findAll().stream()
                .filter(skill -> !isBlank(skill.getName()))
                .filter(skill -> skill.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .map(Skill::getStudentId)
                .filter(Objects::nonNull)
                .collect(LinkedHashSet::new, Set::add, Set::addAll);
    }

    private boolean matchesFilters(
            Student student,
            String search,
            String status,
            String company,
            String branch,
            String batch,
            Set<String> matchingSkillStudentIds
    ) {
        MockStudentsData.StudentData mock = findMockStudent(student);

        if (status != null && !status.equals(normalizeStatus(defaultString(student.getStatus(), safe(() -> mock.status))))) {
            return false;
        }

        String studentBranch = defaultString(student.getBranch(), safe(() -> mock.branch), "Unknown");
        if (branch != null && !branch.equalsIgnoreCase(studentBranch)) {
            return false;
        }

        String studentBatch = resolveBatch(student.getRegNo(), safe(() -> mock.batch));
        if (batch != null && !batch.equalsIgnoreCase(studentBatch)) {
            return false;
        }

        String studentCompany = defaultString(student.getCompany(), safe(() -> mock.currentCompany.name), null);
        if (company != null && !company.equalsIgnoreCase(defaultString(studentCompany, ""))) {
            return false;
        }

        if (search == null) {
            return true;
        }

        String normalizedSearch = search.toLowerCase(Locale.ROOT);
        boolean matchesName = containsIgnoreCase(student.getName(), normalizedSearch)
                || containsIgnoreCase(safe(() -> mock.name), normalizedSearch);
        boolean matchesCompany = containsIgnoreCase(studentCompany, normalizedSearch);
        boolean matchesSkills = matchingSkillStudentIds.contains(student.getId())
                || safeContainsInList(safe(() -> mock.skills), normalizedSearch);

        return matchesName || matchesCompany || matchesSkills;
    }

    private RelatedStudentData loadRelatedStudentData(List<Student> students) {
        List<String> studentIds = students.stream()
                .map(Student::getId)
                .filter(Objects::nonNull)
                .toList();

        if (studentIds.isEmpty()) {
            return new RelatedStudentData(
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of()
            );
        }

        List<StudentCompany> studentCompanies = studentCompanyRepository.findByStudentIdIn(studentIds);
        List<StudentPlacement> placements = studentPlacementRepository.findByStudentIdIn(studentIds);
        List<Skill> skills = skillRepository.findByStudentIdIn(studentIds);
        List<Education> educations = educationRepository.findByStudentIdIn(studentIds);
        List<InterviewExperience> experiences = interviewExperienceRepository.findByStudentIdIn(studentIds);

        Set<String> companyIds = studentCompanies.stream()
                .map(StudentCompany::getCompanyId)
                .filter(value -> !isBlank(value))
                .collect(LinkedHashSet::new, Set::add, Set::addAll);
        Map<String, Company> companyById = new HashMap<>();
        for (Company company : companyRepository.findAllById(companyIds)) {
            companyById.put(company.getId(), company);
        }

        return new RelatedStudentData(
                groupByStudentId(studentCompanies, StudentCompany::getStudentId),
                groupByStudentId(placements, StudentPlacement::getStudentId),
                groupByStudentId(skills, Skill::getStudentId),
                groupByStudentId(educations, Education::getStudentId),
                groupByStudentId(experiences, InterviewExperience::getStudentId),
                companyById
        );
    }

    private long countByStatus(List<Student> students, String status) {
        return students.stream()
                .filter(student -> {
                    MockStudentsData.StudentData mock = findMockStudent(student);
                    return status.equals(normalizeStatus(defaultString(student.getStatus(), safe(() -> mock.status))));
                })
                .count();
    }

    private <T> Map<String, List<T>> groupByStudentId(List<T> values, java.util.function.Function<T, String> studentIdExtractor) {
        Map<String, List<T>> grouped = new HashMap<>();
        for (T value : values) {
            String studentId = studentIdExtractor.apply(value);
            if (isBlank(studentId)) {
                continue;
            }
            grouped.computeIfAbsent(studentId, ignored -> new ArrayList<>()).add(value);
        }
        return grouped;
    }

    private void addIfPresent(Collection<String> values, String value) {
        if (!isBlank(value)) {
            values.add(value);
        }
    }

    private boolean containsIgnoreCase(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private boolean safeContainsInList(List<String> values, String search) {
        if (values == null) {
            return false;
        }
        for (String value : values) {
            if (containsIgnoreCase(value, search)) {
                return true;
            }
        }
        return false;
    }

    private boolean equalsIgnoreCase(String a, String b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        return a.equalsIgnoreCase(b);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String defaultString(String... candidates) {
        for (String candidate : candidates) {
            if (!isBlank(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private <T> T safe(Supplier<T> supplier) {
        try {
            return supplier == null ? null : supplier.get();
        } catch (NullPointerException ignored) {
            return null;
        }
    }

    private static class RelatedStudentData {
        private final Map<String, List<StudentCompany>> studentCompaniesByStudentId;
        private final Map<String, List<StudentPlacement>> placementsByStudentId;
        private final Map<String, List<Skill>> skillsByStudentId;
        private final Map<String, List<Education>> educationsByStudentId;
        private final Map<String, List<InterviewExperience>> interviewExperiencesByStudentId;
        private final Map<String, Company> companyById;

        private RelatedStudentData(
                Map<String, List<StudentCompany>> studentCompaniesByStudentId,
                Map<String, List<StudentPlacement>> placementsByStudentId,
                Map<String, List<Skill>> skillsByStudentId,
                Map<String, List<Education>> educationsByStudentId,
                Map<String, List<InterviewExperience>> interviewExperiencesByStudentId,
                Map<String, Company> companyById
        ) {
            this.studentCompaniesByStudentId = studentCompaniesByStudentId;
            this.placementsByStudentId = placementsByStudentId;
            this.skillsByStudentId = skillsByStudentId;
            this.educationsByStudentId = educationsByStudentId;
            this.interviewExperiencesByStudentId = interviewExperiencesByStudentId;
            this.companyById = companyById;
        }
    }
}
