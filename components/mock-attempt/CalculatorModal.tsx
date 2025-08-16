import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CalculatorModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scientific Calculator</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","sin","cos","tan","log","π","e","√","^"].map(btn => (
            <button key={btn} className="p-3 bg-gray-200 rounded hover:bg-gray-300">{btn}</button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
