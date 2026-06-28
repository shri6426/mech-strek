'use client';

import { useEffect, useState, useRef } from 'react';
import { FolderOpen, FileText, Download, ExternalLink, Image as ImageIcon, Upload, File, Search, X } from 'lucide-react';

interface ClientFile {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

interface ClientProject {
  id: string;
  name: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="w-5 h-5 text-blue-400" />;
  const ft = fileType.toLowerCase();
  if (ft.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
  if (ft.includes('pdf'))   return <FileText className="w-5 h-5 text-red-400" />;
  if (ft.includes('zip') || ft.includes('archive')) return <File className="w-5 h-5 text-amber-400" />;
  return <FileText className="w-5 h-5 text-blue-400" />;
}

function getFileIconBg(fileType?: string) {
  if (!fileType) return 'bg-blue-500/10';
  const ft = fileType.toLowerCase();
  if (ft.includes('image')) return 'bg-purple-500/10';
  if (ft.includes('pdf'))   return 'bg-red-500/10';
  if (ft.includes('zip'))   return 'bg-amber-500/10';
  return 'bg-blue-500/10';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientFilesVault() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const getToken = () => localStorage.getItem('client_token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/client/projects`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data: ClientProject[] = await res.json();
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    const fetchFiles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/client/projects/${selectedProjectId}/files`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFiles(data);
        }
      } catch (err) {
        console.error('Failed to load files', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [selectedProjectId]);

  const uploadFile = async (file: File) => {
    if (!selectedProjectId || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/client/projects/${selectedProjectId}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const newFile = await res.json();
        setFiles((prev) => [newFile, ...prev]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const filteredFiles = files.filter((f) =>
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-28 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonBlock key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Client Vault</span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Files & Assets</h1>
          <p className="text-sm text-neutral-500 mt-1">Securely view and download your project deliverables.</p>
        </div>

        {projects.length > 1 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 transition-colors w-full md:w-56"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Drag-and-drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
          dragOver
            ? 'border-violet-500 bg-violet-500/10'
            : uploadSuccess
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-white/10 bg-[#0d0d0d] hover:border-white/20 hover:bg-white/3'
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragOver ? 'bg-violet-500/20' : 'bg-white/5'}`}>
          <Upload className={`w-5 h-5 ${dragOver ? 'text-violet-400' : uploadSuccess ? 'text-green-400' : 'text-neutral-500'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">
            {uploading ? 'Uploading asset...' : uploadSuccess ? '✓ Asset uploaded successfully!' : 'Upload Brand Assets'}
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">Drag & drop or click to browse</p>
        </div>
      </div>

      {/* Search */}
      {files.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#0d0d0d] rounded-2xl border border-white/5">
            <FolderOpen className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
            <p className="text-sm text-neutral-500">No active projects.</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#0d0d0d] rounded-2xl border border-white/5">
            <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
            <p className="text-sm text-neutral-500">{search ? 'No files match your search.' : 'No deliverables uploaded yet.'}</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group bg-[#0d0d0d] border border-white/5 hover:border-white/15 rounded-2xl p-4 flex flex-col gap-4 transition-all duration-150"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${getFileIconBg(file.file_type)} shrink-0`}>
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate leading-snug" title={file.file_name}>
                    {file.file_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-mono text-neutral-600">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                    {file.file_size && (
                      <>
                        <span className="text-neutral-700">·</span>
                        <p className="text-[10px] font-mono text-neutral-600">{formatFileSize(file.file_size)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2">
                <a
                  href={file.file_url}
                  download={file.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-colors flex justify-center items-center gap-1.5"
                >
                  <Download size={12} /> Download
                </a>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl text-xs transition-colors flex justify-center items-center"
                  title="Open in new tab"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
