"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { batchUploadMembers, type BatchUploadRow } from "@/lib/actions/members";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatusId: string;
}

export function MemberBatchUploadDialog({
  open,
  onOpenChange,
  defaultStatusId,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseResults, setParseResults] = useState<{
    rows: BatchUploadRow[];
    errors: string[];
  } | null>(null);
  const [uploadResults, setUploadResults] = useState<any>(null);

  function downloadTemplate() {
    const template = [
      {
        "Full Name": "Juan Dela Cruz",
        "Facebook Name": "Juan Dela Cruz",
        "Facebook Link": "https://facebook.com/...",
        Leader: "",
        Groups: "Youth, Ministry",
        "Invited By": "Name of inviter",
        Address: "Barangay, Municipality, Province",
        Birthdate: "2010-01-15",
        Age: "14",
        "Age Bracket": "C2",
        Notes: "Any additional notes",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "member-import-template.xlsx");
    toast({ title: "Template downloaded", description: "All members will be automatically set as 'Invited'. Required: Full Name, Address" });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-400", "bg-blue-50");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  }

  function parseExcelFile(file: File) {
    return new Promise<BatchUploadRow[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
            string,
            any
          >[];

          const rows: BatchUploadRow[] = jsonData.map((row, index) => {
            const groups = row["Groups"]
              ? String(row["Groups"])
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
              : [];

            return {
              rowNumber: index + 2,
              name: row["Full Name"] || "",
              contact: row["Facebook Name"] || "",
              email: row["Facebook Link"] || "",
              address: row["Address"] || "",
              invitedBy: row["Invited By"] || "",
              statusId: "", // Will be set to "Invited" status ID in backend
              leaderId: row["Leader"] || "",
              groupIds: groups,
              notes: row["Notes"] || "",
              birthdate: row["Birthdate"] ? String(row["Birthdate"]) : "",
              age: row["Age"] ? parseInt(String(row["Age"]), 10) : undefined,
              ageBracket: row["Age Bracket"] || "",
            };
          });

          resolve(rows);
        } catch (err) {
          reject(
            err instanceof Error ? err.message : "Failed to parse Excel file"
          );
        }
      };
      reader.onerror = () => reject("Failed to read file");
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleFileSelect() {
    if (!file) return;

    setParsing(true);
    try {
      const rows = await parseExcelFile(file);
      setParseResults({
        rows,
        errors: [],
      });
      toast({ title: `Parsed ${rows.length} rows from Excel` });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Parse error";
      setParseResults({
        rows: [],
        errors: [errorMsg],
      });
      toast({
        title: "Failed to parse Excel file",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleUpload() {
    if (!parseResults || parseResults.rows.length === 0) return;

    setUploading(true);
    try {
      const results = await batchUploadMembers(
        parseResults.rows,
        defaultStatusId
      );
      setUploadResults(results);

      if (results.created > 0) {
        toast({
          title: `Successfully created ${results.created} members`,
        });
      }

      if (results.errors.length > 0) {
        toast({
          title: `${results.errors.length} rows had errors`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setFile(null);
    setParseResults(null);
    setUploadResults(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Upload Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Download Template */}
          {!parseResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400">1</span>
                  Download Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Excel Template
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Fill out the template with member details, then upload it
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select File */}
          {!parseResults && !uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400">
                    {file ? "2" : "1"}
                  </span>
                  Select Excel File
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drag and drop or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Only Excel files (.xlsx, .xls)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        onClick={handleFileSelect}
                        disabled={parsing}
                        className="gap-2"
                      >
                        {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Parse
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground p-2 bg-blue-50 border border-blue-200 rounded">
                      ⓘ All members will be automatically set as <strong>"Invited" status</strong>. Required: Full Name, Address
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review Data */}
          {parseResults && !uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400">2</span>
                  Review Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parseResults.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Parse Error
                      </p>
                      <p className="text-xs text-red-700">
                        {parseResults.errors[0]}
                      </p>
                    </div>
                  </div>
                )}

                {parseResults.rows.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Found {parseResults.rows.length} members to import
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="text-left px-2 py-1.5 font-medium">
                              Name
                            </th>
                            <th className="text-left px-2 py-1.5 font-medium">
                              Address
                            </th>
                            <th className="text-left px-2 py-1.5 font-medium">
                              Status
                            </th>
                            <th className="text-left px-2 py-1.5 font-medium">
                              Age
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {parseResults.rows.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-2 py-1">{row.name}</td>
                              <td className="px-2 py-1 truncate max-w-[100px]">{row.address}</td>
                              <td className="px-2 py-1">{row.statusId || "—"}</td>
                              <td className="px-2 py-1">
                                {row.age ? `${row.age} (${row.ageBracket})` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setParseResults(null);
                    }}
                  >
                    Select Different File
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || parseResults.rows.length === 0}
                    className="gap-2 flex-1"
                  >
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Upload {parseResults.rows.length} Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Results */}
          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400">3</span>
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600">Total</p>
                    <p className="text-lg font-bold text-blue-900">
                      {uploadResults.total}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-600">Created</p>
                    <p className="text-lg font-bold text-green-900">
                      {uploadResults.created}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">Errors</p>
                    <p className="text-lg font-bold text-red-900">
                      {uploadResults.errors.length}
                    </p>
                  </div>
                </div>

                {uploadResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Errors</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadResults.errors.map(
                        (err: any, i: number) => (
                          <div
                            key={i}
                            className="text-xs p-2 bg-red-50 border border-red-200 rounded flex gap-2"
                          >
                            <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Row {err.rowNumber}:</strong> {err.message}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
