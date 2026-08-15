'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Image as ImageIcon, Trash2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FileUploadCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag'> {
  files: UploadedFile[];
  onFilesChange: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onClose?: () => void;
  disabled?: boolean;
  previewUrl?: string | null;
  previewAlt?: string;
}

const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export const FileUploadCard = React.forwardRef<HTMLDivElement, FileUploadCardProps>(function FileUploadCard({ className, files = [], onFilesChange, onFileRemove, onClose, disabled, previewUrl, previewAlt = 'Uploaded image' }, ref) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const acceptFiles = (incoming: File[]) => onFilesChange(incoming.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)).slice(0, 1));

  return <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('w-full rounded-2xl border bg-background shadow-sm', className)}>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10"><UploadCloud className="h-5 w-5 text-primary" /></div><div><h3 className="font-bold">Upload your photo</h3><p className="mt-1 text-xs text-muted-foreground">Choose one image or drag it here</p></div></div>
        {onClose && <button type="button" aria-label="Close upload" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}
      </div>
      <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFiles(Array.from(event.dataTransfer.files)); }} onClick={() => !disabled && inputRef.current?.click()} className={cn('mt-5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors', isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50', disabled && 'cursor-not-allowed opacity-60')}>
        <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => { acceptFiles(Array.from(event.target.files || [])); event.currentTarget.value = ''; }} />
        <ImageIcon className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
        <p className="font-semibold">Choose an image or drag and drop</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · maximum 5 MB</p>
        <span className="mt-4 inline-flex rounded-lg border px-3 py-2 text-xs font-bold">Browse image</span>
      </div>
    </div>
    {previewUrl && <div className="border-t p-4 sm:p-5"><img src={previewUrl} alt={previewAlt} className="max-h-56 w-full rounded-xl object-contain bg-muted/30" /><button type="button" onClick={(event) => { event.stopPropagation(); onFileRemove('preview'); }} className="mt-3 rounded-lg border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted">Remove uploaded image</button></div>}
    {files.length > 0 && <div className="border-t p-5 sm:p-6"><AnimatePresence>{files.map((entry) => <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">IMG</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(entry.file.size)} · <span className={entry.status === 'completed' ? 'text-green-600' : entry.status === 'error' ? 'text-destructive' : 'text-primary'}>{entry.status === 'completed' ? 'Uploaded' : entry.status === 'error' ? 'Upload failed' : 'Uploading…'}</span></p>{entry.status === 'uploading' && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${entry.progress}%` }} /></div>}</div>{entry.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}<button type="button" aria-label="Remove image" onClick={() => onFileRemove(entry.id)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Trash2 className="h-4 w-4" /></button></motion.div>)}</AnimatePresence></div>}
  </motion.div>;
});
