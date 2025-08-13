// components/admin/mocks/ManageQuestionsModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MockTest } from "@/types";
import { Plus } from "lucide-react";

interface ManageQuestionsModalProps {
  mock: MockTest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManageQuestionsModal({
  mock,
  open,
  onOpenChange,
  onSuccess,
}: ManageQuestionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Questions: {mock.title} ({mock.questions.length} questions)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Questions List</h3>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </div>
            
            {mock.questions.length > 0 ? (
              <div className="space-y-3">
                {mock.questions.map((question, index) => (
                  <div key={index} className="border p-3 rounded-lg">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Q{index + 1}: {question.text}</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </div>
                    {/* Add more question details here */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No questions yet. Add your first question.
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Handle save logic
                onSuccess?.();
                onOpenChange(false);
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}