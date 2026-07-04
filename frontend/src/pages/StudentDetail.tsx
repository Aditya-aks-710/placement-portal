import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Edit,
  Star,
  ExternalLink,
  MessageSquare,
  Building2,
  Pencil,
  Plus,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteEducation, getStudents, updateStudentSkills } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AddExperienceDialog from "@/components/AddExperienceDialog";
import AddEducationDialog from "@/components/AddEducationDialog";
import AddPlacementDialog from "@/components/AddPlacementDialog";
import ConvertEngagementDialog from "@/components/ConvertEngagementDialog";
import ProgressEngagementDialog from "@/components/ProgressEngagementDialog";
import PositionTimeline from "@/components/PositionTimeline";
import ManagePositionsDialog from "@/components/ManagePositionsDialog";

const statusConfig = {
  placed: { label: "Placed", className: "bg-placed text-placed-foreground" },
  unplaced: { label: "Unplaced", className: "bg-unplaced text-unplaced-foreground" },
  internship: { label: "Intern", className: "bg-internship text-internship-foreground" },
  pending: { label: "Pending", className: "bg-muted text-foreground" },
};

const difficultyColor = {
  Easy: "text-placed",
  Medium: "text-internship",
  Hard: "text-destructive",
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, username } = useAuth();
  const { data: students = [], isLoading, isError, error } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });
  const student = students.find((s) => s.id === id);
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "education" | "skills">("overview");
  const [skillInput, setSkillInput] = useState("");
  const queryClient = useQueryClient();
  const skillsMutation = useMutation({
    mutationFn: (skills: string[]) => updateStudentSkills(student!.id, skills),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Skills updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update skills");
    },
  });

  const educationDeleteMutation = useMutation({
    mutationFn: (educationId: string) => deleteEducation(student!.id, educationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["students"]
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove education");
    },
  });

  const errorMessage = error instanceof Error ? error.message : "Unable to load student details from backend.";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-sm text-muted-foreground">Loading student details...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
          <Link to="/" className="mt-4 inline-block text-accent underline">Go back</Link>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex flex-col items-center justify-center py-32">
          <h2 className="font-display text-2xl font-bold">Student not found</h2>
          <Link to="/" className="mt-4 text-accent underline">Go back</Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[student.status] ?? statusConfig.unplaced;
  const isOwnProfile =
    !!username &&
    !!student.regno &&
    username.trim().toLowerCase() === student.regno.trim().toLowerCase();
  // Admins can edit any profile; a student can only edit their own card.
  const canEdit = isAuthenticated && (isAdmin || isOwnProfile);
  // Unplaced students' profiles are not viewable, except by an admin or the owner.
  const canView = student.status !== "unplaced" || isAdmin || isOwnProfile;

  if (!canView) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex flex-col items-center justify-center py-32 text-center">
          <h2 className="font-display text-2xl font-bold">Profile not available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This student hasn't recorded a placement yet, so their profile isn't viewable.
          </p>
          <Link to="/" className="mt-4 text-accent underline">Go back</Link>
        </div>
      </div>
    );
  }

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
  ];
  const colorIndex = student.name.charCodeAt(0) % colors.length;

  // Companies the student was placed at, offered as suggestions when sharing an experience.
  const companyOptions = Array.from(
    new Set(
      [student.currentCompany?.name, ...student.pastCompanies.map((c) => c.name)].filter(
        (name): name is string => !!name,
      ),
    ),
  );

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "interviews" as const, label: "Interviews" },
    { key: "education" as const, label: "Education" },
    { key: "skills" as const, label: "Skills" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="gradient-hero pb-24 pt-8 px-4">
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5 min-w-0">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colors[colorIndex]} text-2xl font-bold text-white shadow-xl`}
              >
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl break-words">
                    {student.name}
                  </h1>
                  <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>
                </div>
                {student.bio && (
                  <p className="mt-1.5 text-sm text-primary-foreground/70">{student.bio}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-primary-foreground/60">
                  <span className="flex items-center gap-1 min-w-0"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{student.email}</span></span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 shrink-0" /> {student.phone}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 shrink-0" /> {student.branch} - {student.batch}</span>
                </div>
              </div>
            </div>

            {canEdit ? (
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:shrink-0">
                <AddPlacementDialog
                  studentId={student.id}
                  trigger={
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Submit Placement
                    </Button>
                  }
                />
              </div>
            ) : !isAuthenticated ? (
              <Button
                onClick={() => navigate("/login")}
                aria-label="Edit Profile"
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 lg:shrink-0"
              >
                <Edit className="h-4 w-4 mr-2 sm:mr-0 lg:mr-2" />
                <span className="inline sm:hidden lg:inline">Edit Profile</span>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <main className="container -mt-12">
        <div className="mb-6">
          <div className="elevated-card grid grid-cols-4 gap-1 rounded-xl p-1.5 sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-lg px-2 py-2 text-center text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            {student.currentCompany && (
              <div className="lg:col-span-2 elevated-card rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-accent" />
                  Current Position
                </h2>
                <div className="mt-4 rounded-lg bg-muted/40 p-4 border border-border/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 ring-1 ring-border/40">
                        {student.currentCompany.logo ? (
                          <img
                            src={student.currentCompany.logo}
                            alt={student.currentCompany.name}
                            className="h-6 w-6 rounded object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{student.currentCompany.name}</h3>
                          {student.currentCompany.converted || student.currentCompany.type === "full-time" ? (
                            <Badge className="bg-placed/15 text-placed text-[10px] hover:bg-placed/15">
                              Full time
                            </Badge>
                          ) : (
                            <Badge className="bg-internship/15 text-internship text-[10px] hover:bg-internship/15">
                              Internship
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {canEdit && student.currentCompany.id && (
                      <ManagePositionsDialog
                        company={student.currentCompany}
                        studentId={student.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Manage roles
                          </Button>
                        }
                      />
                    )}
                  </div>

                  <div className="mt-4 pl-1">
                    <PositionTimeline company={student.currentCompany} />
                  </div>

                  {canEdit &&
                    student.currentCompany.type === "internship" &&
                    !student.currentCompany.converted && (
                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
                        <ProgressEngagementDialog
                          company={student.currentCompany}
                          studentId={student.id}
                        />
                        <ConvertEngagementDialog company={student.currentCompany} studentId={student.id} />
                      </div>
                    )}
                </div>
              </div>
            )}

            {student.pastCompanies.length > 0 && (
              <div className="lg:col-span-2 lg:row-start-2 elevated-card rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  Past Experience
                </h2>
                <div className="mt-4 space-y-3">
                  {student.pastCompanies.map((company, i) => (
                    <div key={i} className="rounded-lg bg-muted/40 p-4 border border-border/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 ring-1 ring-border/40">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="h-6 w-6 rounded object-contain" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{company.name}</h3>
                            {company.converted || company.type === "full-time" ? (
                              <Badge className="bg-placed/15 text-placed text-[10px] hover:bg-placed/15">
                                Full time
                              </Badge>
                            ) : (
                              <Badge className="bg-internship/15 text-internship text-[10px] hover:bg-internship/15">
                                Internship
                              </Badge>
                            )}
                          </div>
                        </div>
                        {canEdit && company.id && (
                          <ManagePositionsDialog
                            company={company}
                            studentId={student.id}
                            trigger={
                              <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                      <div className="mt-4 pl-1">
                        <PositionTimeline company={company} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(student.skills.length > 0 || student.linkedin || student.github) && (
              <div className="lg:col-start-3 lg:row-start-1 elevated-card rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-foreground">Skills</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {student.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-medium">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {(student.linkedin || student.github) && (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-sm font-medium text-foreground mb-3">Links</h3>
                    <div className="space-y-2">
                      {student.linkedin && (
                        <a
                          href={`https://${student.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-accent hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                      {student.github && (
                        <a
                          href={`https://${student.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-accent hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> GitHub
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "interviews" && (
          <div className="space-y-6 animate-fade-in">
            {student.interviewExperiences.length > 0 && canEdit && (
              <div className="elevated-card rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Share another interview experience to help juniors prepare.
                </p>
                <AddExperienceDialog
                  studentId={student.id}
                  companyOptions={companyOptions}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Share your experience
                    </Button>
                  }
                />
              </div>
            )}
            {student.interviewExperiences.length === 0 ? (
              <div className="elevated-card rounded-xl p-12 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">No interview experiences shared yet.</p>
                {canEdit && (
                  <AddExperienceDialog
                    studentId={student.id}
                    companyOptions={companyOptions}
                    trigger={
                      <Button variant="outline" size="sm" className="mt-5">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Share your experience
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              student.interviewExperiences.map((exp, i) => (
                <div key={i} className="elevated-card rounded-xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">{exp.company}</h2>
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <span className={`font-medium ${difficultyColor[exp.difficulty]}`}>
                          {exp.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-internship">
                          {Array.from({ length: exp.rating }).map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                      </div>
                    </div>
                    {exp.placedHere && (
                      <Badge variant="secondary" className="shrink-0">Placed here</Badge>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    {exp.rounds.map((round, j) => (
                      <div key={j} className="relative pl-6 border-l-2 border-accent/30">
                        <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-accent" />
                        <h3 className="font-semibold text-foreground">{round.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{round.description}</p>
                        <p className="mt-1 text-xs text-accent">Tip: {round.tips}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg bg-accent/5 border border-accent/20 p-4">
                    <h3 className="text-sm font-semibold text-accent">Overall Tips</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{exp.overallTips}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "education" && (
          <div className="space-y-4 animate-fade-in">
            {student.education.length > 0 && canEdit && (
              <div className="elevated-card rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Add your degrees, schools, or certifications.
                </p>
                <AddEducationDialog
                  studentId={student.id}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4"/>
                      Add Education
                    </Button>
                  }
                  />
              </div>
            )}

            {student.education.length === 0 ? (
              <div className="elevated-card rounded-xl p-12 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">
                  No education added yet.
                </p>
                {canEdit && (
                  <AddEducationDialog 
                    studentId={student.id}
                    trigger={
                      <Button variant="outline" size="sm" className="mt-5">
                        <Plus className="mr-2 h-4 w-4" />
                        Add education
                      </Button>
                    }
                    />
                )}
              </div>
            ) : (
              student.education.map((edu, i) => (
                <div key={edu.id ?? i} className="elevated-card rounded-xl p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <GraduationCap className="h-6 w-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{edu.year}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {edu.grade && (
                      <Badge variant="outline" className="font-semibold">{edu.grade}</Badge>
                    )}
                    {canEdit && edu.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove education"
                        disabled={educationDeleteMutation.isPending}
                        onClick={() => educationDeleteMutation.mutate(edu.id!)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6 animate-fade-in">
            <div className="elevated-card rounded-xl p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-bold text-foreground">Skills</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Skills help others discover this profile when they search for these technologies.
              </p>

              {canEdit && (
                <form
                  className="mt-5 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = skillInput.trim();
                    if (!trimmed) return;
                    const exists = student.skills.some(
                      (s) => s.toLowerCase() === trimmed.toLowerCase(),
                    );
                    if (exists) {
                      toast.info("Skill already added");
                      setSkillInput("");
                      return;
                    }
                    skillsMutation.mutate([...student.skills, trimmed]);
                    setSkillInput("");
                  }}
                >
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill (e.g. React, Java, AWS)"
                    className="max-w-sm"
                    disabled={skillsMutation.isPending}
                  />
                  <Button type="submit" disabled={skillsMutation.isPending || !skillInput.trim()}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add
                  </Button>
                </form>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {student.skills.length > 0 ? (
                  student.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="group gap-1.5 py-1.5 pl-3 pr-2 text-sm font-medium"
                    >
                      {skill}
                      {canEdit && (
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() =>
                            skillsMutation.mutate(
                              student.skills.filter((s) => s !== skill),
                            )
                          }
                          disabled={skillsMutation.isPending}
                          className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {canEdit
                      ? "No skills added yet. Add your first skill above."
                      : "No skills added yet."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="h-12" />
      </main>
    </div>
  );
};

export default StudentDetail;
