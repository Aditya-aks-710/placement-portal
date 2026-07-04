import { submitEducation } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";

type AddEducationDialogProps = {
    trigger: React.ReactNode;
    studentId: string;
};

const AddEducationDialog = ({
    trigger, studentId
}: AddEducationDialogProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [degree, setDegree] = useState("");
    const [institution, setInstitution] = useState("");
    const [year, setYear] = useState("");
    const [grade, setGrade] = useState("");

    useEffect(() => {
        if(open) {
            setDegree("");
            setInstitution("");
            setYear("");
            setGrade("");
        }
    }, [open]);

    const mutation = useMutation({
        mutationFn: () => 
            submitEducation(studentId, {
                degree: degree.trim(),
                institution: institution.trim(),
                year: year.trim(),
                grade: grade.trim(),
            }),
        onSuccess: () => {
            toast.success("Education Added");
            queryClient.invalidateQueries({
                queryKey: ["students"]
            });
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add education"),
    });

    const handleSubmit = (e : React.FormEvent) => {
        e.preventDefault();
        if(!degree.trim()) {
            toast.error("Degree is required");
            return;
        }
        if(!institution.trim()) {
            toast.error("Institution is required");
            return;
        }
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" />
            Add education
          </DialogTitle>
          <DialogDescription>
            Add a degree, school, or certification to your profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edu-degree">Degree / Course</Label>
            <Input
              id="edu-degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.Tech Computer Science"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edu-institution">School / Institution</Label>
            <Input
              id="edu-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. NIT Trichy"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edu-year">Year / Duration</Label>
              <Input
                id="edu-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2022 - 2026"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-grade">Grade / CGPA</Label>
              <Input
                id="edu-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 8.9 CGPA"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add education
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    );
};

export default AddEducationDialog;