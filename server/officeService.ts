import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "secret";
const ONLYOFFICE_SERVER_URL = process.env.ONLYOFFICE_SERVER_URL || "http://localhost:8080";

export interface OnlyOfficeConfig {
    document: {
        fileType: string;
        key: string;
        title: string;
        url: string;
        permissions?: {
            edit: boolean;
            download: boolean;
            print: boolean;
            review: boolean;
        };
    };
    documentType: string;
    editorConfig: {
        callbackUrl: string;
        user: {
            id: string;
            name: string;
        };
        lang: string;
        mode: 'edit' | 'view';
        customization?: any;
    };
    token?: string;
}

export const getDocumentType = (extension: string): string => {
    const ext = extension.toLowerCase().replace('.', '');
    if (['docx', 'doc', 'txt', 'rtf', 'odt'].includes(ext)) return 'word';
    if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) return 'cell';
    if (['pptx', 'ppt', 'odp'].includes(ext)) return 'slide';
    return 'word';
};

export const generateOnlyOfficeConfig = (
    docId: string,
    title: string,
    fileName: string,
    userId: string,
    userName: string,
    baseUrl: string,
    mode: 'edit' | 'view' = 'edit'
): OnlyOfficeConfig => {
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    const docType = getDocumentType(ext);

    const config: OnlyOfficeConfig = {
        document: {
            fileType: ext,
            key: `${docId}_${Date.now()}`, // Key must be unique for each session to avoid cache issues if needed, but it should be consistent for collaboration
            title: title,
            url: `${baseUrl}/api/office/download/${docId}`,
            permissions: {
                edit: mode === 'edit',
                download: true,
                print: true,
                review: true
            }
        },
        documentType: docType,
        editorConfig: {
            callbackUrl: `${baseUrl}/api/office/callback/${docId}`,
            user: {
                id: userId,
                name: userName
            },
            lang: 'it',
            mode: mode,
            customization: {
                forcesave: true,
                autosave: true,
                compactHeader: false,
                compactToolbar: false,
                help: false,
                ui: {
                    chat: true,
                    comments: true,
                    feedback: false
                }
            }
        }
    };

    // Sign token if secret is provided
    if (ONLYOFFICE_JWT_SECRET) {
        config.token = jwt.sign(config as any, ONLYOFFICE_JWT_SECRET);
    }

    return config;
};

export const createBlankDocument = (type: 'docx' | 'xlsx' | 'pptx'): Buffer => {
    // Normally we would have template files on disk
    // For now, return an empty buffer or handle template copying in the route
    return Buffer.from("");
};

export const officeUploadDir = path.join(process.cwd(), 'uploads', 'office');
if (!fs.existsSync(officeUploadDir)) {
    fs.mkdirSync(officeUploadDir, { recursive: true });
}
