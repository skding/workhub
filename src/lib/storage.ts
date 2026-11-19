import fs from "fs";
import path from "path";

// Get root path from environment or default to local synced OneDrive
export function getOneDriveRoot(): string {
  // If explicitly configured in .env
  if (process.env.ONEDRIVE_ROOT_PATH) {
    return path.resolve(process.env.ONEDRIVE_ROOT_PATH);
  }

  // Windows default auto-detection
  if (process.env.OneDrive) {
    return path.resolve(process.env.OneDrive);
  }

  // Default fallback directory
  return path.resolve(process.cwd(), "data", "onedrive");
}

export interface LocalFileInfo {
  fileName: string;
  category: "INPUT" | "DESIGN" | "COSTING";
  fileType: string;
  fileSize: number;
  filePath: string;
  relativePath: string;
  lastModified: Date;
}

// Ensure the standardized project folder and 3 sub-folders exist on disk:
// [Root]/WorkHub/2026/[folderName]/
//    ├── 01_Client_Inputs
//    ├── 02_Design_Concepts
//    └── 03_Costing_Revisions
export function ensureProjectFolderStructure(folderName: string): {
  projectDir: string;
  subfolders: { inputs: string; design: string; costing: string };
} {
  const root = getOneDriveRoot();
  const year = new Date().getFullYear().toString();
  const projectDir = path.join(root, "WorkHub", year, folderName);

  const subfolders = {
    inputs: path.join(projectDir, "01_Client_Inputs"),
    design: path.join(projectDir, "02_Design_Concepts"),
    costing: path.join(projectDir, "03_Costing_Revisions"),
  };

  // Create directories recursively if they don't exist
  if (!fs.existsSync(subfolders.inputs)) {
    fs.mkdirSync(subfolders.inputs, { recursive: true });
  }
  if (!fs.existsSync(subfolders.design)) {
    fs.mkdirSync(subfolders.design, { recursive: true });
  }
  if (!fs.existsSync(subfolders.costing)) {
    fs.mkdirSync(subfolders.costing, { recursive: true });
  }

  return { projectDir, subfolders };
}

// Determine file category and type
function detectFileType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  if ([".dwg", ".dxf", ".step", ".stp", ".igs", ".iges", ".sldprt"].includes(ext)) return "cad";
  if ([".xlsx", ".xls", ".csv"].includes(ext)) return "excel";
  return "other";
}

// Scan the enquiry directory on disk for all existing and newly added files
export function scanEnquiryFolder(folderName: string): LocalFileInfo[] {
  const root = getOneDriveRoot();
  const year = new Date().getFullYear().toString();
  const projectDir = path.join(root, "WorkHub", year, folderName);

  if (!fs.existsSync(projectDir)) {
    return [];
  }

  const results: LocalFileInfo[] = [];
  const categories: { folderName: string; category: "INPUT" | "DESIGN" | "COSTING" }[] = [
    { folderName: "01_Client_Inputs", category: "INPUT" },
    { folderName: "02_Design_Concepts", category: "DESIGN" },
    { folderName: "03_Costing_Revisions", category: "COSTING" },
  ];

  for (const { folderName: subName, category } of categories) {
    const subPath = path.join(projectDir, subName);
    if (fs.existsSync(subPath)) {
      const items = fs.readdirSync(subPath);
      for (const item of items) {
        const fullItemPath = path.join(subPath, item);
        try {
          const stats = fs.statSync(fullItemPath);
          if (stats.isFile()) {
            results.push({
              fileName: item,
              category,
              fileType: detectFileType(item),
              fileSize: stats.size,
              filePath: fullItemPath,
              relativePath: path.relative(root, fullItemPath).replace(/\\/g, "/"),
              lastModified: stats.mtime,
            });
          }
        } catch (e) {
          console.warn("Could not read file stat:", fullItemPath, e);
        }
      }
    }
  }

  return results;
}

// Save uploaded file into the correct subfolder on disk
export function saveFileToEnquiryFolder(
  folderName: string,
  category: "INPUT" | "DESIGN" | "COSTING",
  fileName: string,
  buffer: Buffer
): { fullPath: string; relativePath: string; size: number } {
  const { subfolders } = ensureProjectFolderStructure(folderName);
  let targetDir = subfolders.inputs;
  if (category === "DESIGN") targetDir = subfolders.design;
  else if (category === "COSTING") targetDir = subfolders.costing;

  const fullPath = path.join(targetDir, fileName);
  fs.writeFileSync(fullPath, buffer);

  const root = getOneDriveRoot();
  const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");

  return {
    fullPath,
    relativePath,
    size: buffer.length,
  };
}
