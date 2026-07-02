import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import StudentCard from "@/components/StudentCard";
import FilterBar from "@/components/FilterBar";
import Navbar from "@/components/Navbar";
import { Users, CheckCircle, Clock, Briefcase } from "lucide-react";
import { getStudentFilterOptions, getStudentsPage } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const deferredSearch = useDeferredValue(search.trim());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryFilters = useMemo(
    () => ({
      search: deferredSearch || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      company: companyFilter !== "all" ? companyFilter : undefined,
      branch: branchFilter !== "all" ? branchFilter : undefined,
      batch: batchFilter !== "all" ? batchFilter : undefined,
    }),
    [batchFilter, branchFilter, companyFilter, deferredSearch, statusFilter],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["students", "infinite", queryFilters],
    queryFn: ({ pageParam }) =>
      getStudentsPage({
        ...queryFilters,
        page: Number(pageParam),
        size: 12,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
  const { data: filterOptions } = useQuery({
    queryKey: ["students", "filters"],
    queryFn: getStudentFilterOptions,
  });
  const errorMessage = error instanceof Error ? error.message : "Unable to load students from backend.";
  const students = useMemo(() => data?.pages.flatMap((page) => page.students) ?? [], [data]);
  const summary = data?.pages[0];
  const companies = filterOptions?.companies ?? [];
  const branches = filterOptions?.branches ?? [];
  const batches = filterOptions?.batches ?? [];
  const totalStudents = summary?.total ?? students.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, students.length]);

  const activeFilters = [branchFilter, batchFilter, statusFilter, companyFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("all");
    setBatchFilter("all");
    setStatusFilter("all");
    setCompanyFilter("all");
  };
  const placedCount = summary?.placedCount ?? 0;
  const unplacedCount = summary?.unplacedCount ?? 0;
  const internCount = summary?.internshipCount ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero py-12 px-4">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                Placement Portal
              </h1>
              <p className="mt-2 text-sm text-primary-foreground/70 max-w-lg">
                Explore placement records, interview experiences, and career insights from our students.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[200px] text-sm bg-white/10 border-white/20 text-primary-foreground">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[170px] text-sm bg-white/10 border-white/20 text-primary-foreground">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: "Total Students", value: totalStudents, color: "bg-white/10" },
              { icon: CheckCircle, label: "Placed", value: placedCount, color: "bg-placed/20" },
              { icon: Clock, label: "Unplaced", value: unplacedCount, color: "bg-white/10" },
              { icon: Briefcase, label: "Internships", value: internCount, color: "bg-internship/20" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`rounded-xl ${color} backdrop-blur-sm p-4 border border-white/10`}>
                <Icon className="h-5 w-5 text-primary-foreground/70" />
                <div className="mt-2 text-2xl font-bold text-primary-foreground">{value}</div>
                <div className="text-xs text-primary-foreground/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-8">
        {isLoading && (
          <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Loading students from backend...
          </div>
        )}

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          companyFilter={companyFilter}
          onCompanyChange={setCompanyFilter}
          companies={companies}
          activeFilters={activeFilters}
          onClearFilters={clearFilters}
        />

        <div className="mt-2 mb-4 text-sm text-muted-foreground">
          Showing {students.length} of {totalStudents} students
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>

        {students.length > 0 && <div ref={loadMoreRef} className="h-4" />}

        {isFetchingNextPage && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading more students...
          </div>
        )}

        {!isLoading && totalStudents === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No students found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
