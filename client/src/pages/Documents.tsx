import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentsContent } from "./DocumentsContent";

export default function Documents() {
  return (
    <AppLayout title="Documenti">
      <div className="flex-1 overflow-hidden">
        <DocumentsContent />
      </div>
    </AppLayout>
  );
}
