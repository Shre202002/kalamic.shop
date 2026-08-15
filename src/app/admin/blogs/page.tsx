'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Stack, alpha, useTheme,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Switch, FormControlLabel, LinearProgress,
  Tooltip, CircularProgress, Container,
  Menu, ToggleButton, ToggleButtonGroup,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Alert, Popover
} from '@mui/material';
import {
  Add, Edit, Delete, CloudUpload,
  Search, Save, Close, FormatBold, FormatItalic,
  AddPhotoAlternate,
  EditNote, 
  HorizontalRule, ViewColumn, ViewWeek, Info, Warning, CheckCircle, Error as XCircle,
  PhotoLibrary, FormatListBulleted, FormatListNumbered, Link as LinkIcon,
  FormatUnderlined, StrikethroughS, FormatClear, ViewQuilt, Message,
  Code as CodeIcon
} from '@mui/icons-material';
import { Copy, Package } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import DOMPurify from 'dompurify';
import Image from 'next/image';

const DEFAULT_CATEGORIES = ["Tips", "Heritage", "Product Spotlight", "How-to", "News", "Care Guide"];
const BLOG_PLACEHOLDER = "https://picsum.photos/seed/kalamic-blog/1200/675";

const getCoverImage = (url?: string) => {
  if (!url || url.trim() === "") return BLOG_PLACEHOLDER;
  return url;
};

export default function BlogStudio() {
  const theme = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState<any>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryInsertMode, setGalleryInsertMode] = useState<'cover' | 'content'>('cover');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [productAnchorEl, setProductAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Layout selection state for Gallery Picker
  const [pendingGalleryImage, setPendingGalleryImage] = useState<any>(null);
  const [galleryImageLayout, setGalleryImageLayout] = useState<'full' | 'float' | 'center'>('full');

  // Callout Menu State
  const [calloutAnchorEl, setCalloutAnchorEl] = useState<null | HTMLElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo(() => {
    return formData?.content?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0;
  }, [formData?.content]);

  const readTime = useMemo(() => Math.ceil(wordCount / 200), [wordCount]);

  const loadBlogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs?adminId=${user.uid}`);
      const data = await res.json();
      setBlogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Auto Slug Generation
  useEffect(() => {
    if (formData && !slugManuallyEdited && formData.title) {
      const generated = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev: any) => ({ 
        ...prev, slug: generated 
      }));
    }
  }, [formData?.title, slugManuallyEdited]);

  // Product Search Debounce
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(productSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setProductResults(data.products?.slice(0, 5) || data.slice?.(0, 5) || []);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Autosave Logic
  useEffect(() => {
    if (!editorOpen || !formData) return;
    const timer = setTimeout(() => {
      localStorage.setItem('blog_draft_autosave', JSON.stringify(formData));
    }, 10000);
    return () => clearTimeout(timer);
  }, [formData, editorOpen]);

  const loadGallery = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/gallery?adminId=${user.uid}`);
      const data = await res.json();
      setGalleryItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditor = (blog?: any) => {
    const draft = localStorage.getItem('blog_draft_autosave');
    if (blog) {
      const seo = blog.seo || {};
      setFormData({
        ...blog,
        excerpt: blog.excerpt || '',
        tags: Array.isArray(blog.tags) ? blog.tags : [],
        seo: {
          metaTitle: seo.metaTitle || seo.meta_title || '',
          metaDescription: seo.metaDescription || seo.meta_description || '',
          metaKeywords: Array.isArray(seo.metaKeywords) ? seo.metaKeywords : (Array.isArray(seo.meta_keywords) ? seo.meta_keywords : []),
          canonicalUrl: seo.canonicalUrl || seo.canonical_url || '',
          ogImage: seo.ogImage || seo.og_image || '',
        },
        coverImage: blog.coverImage || { url: '', alt: blog.title || '' },
      });
      setSlugManuallyEdited(true);
    } else {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: 'Heritage',
        coverImage: { url: '', alt: '' },
        tags: [],
        seo: { metaTitle: '', metaDescription: '', metaKeywords: [] },
        linkedProducts: [],
        status: 'draft',
        isFeatured: false,
        scheduledAt: null,
        author: { name: user?.displayName || 'Kalamic Artisan' }
      });
      setSlugManuallyEdited(false);
    }
    setActiveTab(0);
    setEditorOpen(true);
  };

  const insertAtCursor = (html: string) => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        visualEditorRef.current.innerHTML += html;
      }
      setFormData((prev: any) => ({
        ...prev,
        content: visualEditorRef.current!.innerHTML
      }));
    } else {
      const currentContent = formData.content || '';
      setFormData((prev: any) => ({ ...prev, content: currentContent + html }));
    }
  };

  const execFormatting = (command: string, value: string = '') => {
    if (editorMode !== 'visual') return;
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      setFormData((prev: any) => ({
        ...prev,
        content: visualEditorRef.current!.innerHTML
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !user) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Title and Content are required.' });
      return;
    }

    if ((formData.excerpt?.length || 0) < 120) {
      toast({ variant: 'destructive', title: 'Excerpt Too Short', description: 'Min 120 characters required for SEO.' });
      return;
    }

    if (formData.status === 'published') {
      const seo = formData.seo || {};
      const missing: string[] = [];
      if (!formData.coverImage?.url) missing.push('cover image');
      if (!seo.metaTitle || seo.metaTitle.length < 50 || seo.metaTitle.length > 60) missing.push('50–60 character meta title');
      if (!seo.metaDescription || seo.metaDescription.length < 120 || seo.metaDescription.length > 160) missing.push('120–160 character meta description');
      if (!Array.isArray(seo.metaKeywords) || seo.metaKeywords.length < 3) missing.push('at least 3 SEO keywords');
      if (!Array.isArray(formData.tags) || formData.tags.length < 3) missing.push('at least 3 tags');
      if (wordCount <= 300) missing.push('more than 300 words');
      if (missing.length) {
        toast({ variant: 'destructive', title: 'Complete SEO before publishing', description: `Please add: ${missing.join(', ')}.` });
        setActiveTab(1);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Sanitization Pass
      const cleanContent = DOMPurify.sanitize(formData.content, {
        ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li',
          'blockquote','strong','em','u','s','a','img','div','span',
          'hr','table','thead','tbody','tr','th','td','code','pre','br'],
        ALLOWED_ATTR: ['href','src','alt','class','style','target','rel',
          'width','height','id'],
        FORCE_BODY: true
      });

      // Slug uniqueness check
      let finalSlug = formData.slug;
      const slugCheckUrl = `/api/admin/blogs/check-slug?slug=${encodeURIComponent(finalSlug)}${formData._id ? `&excludeId=${formData._id}` : ''}`;
      const checkRes = await fetch(slugCheckUrl);
      const checkData = await checkRes.json();
      
      if (checkData.exists) {
        finalSlug = `${formData.slug}-${Date.now().toString().slice(-4)}`;
      }

      const isUpdate = !!formData._id;
      const url = isUpdate ? `/api/admin/blogs/${formData._id}` : '/api/admin/blogs';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          content: cleanContent,
          slug: finalSlug,
          adminId: user.uid,
          scheduledAt: formData.scheduledAt || null
        })
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.message || 'Failed to save blog');

      localStorage.removeItem('blog_draft_autosave');
      toast({ title: isUpdate ? 'Post Refined' : 'Post Created' });
      setEditorOpen(false);
      loadBlogs();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = true) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('seoName', formData.title || 'blog-image');

      const res = await fetch('/api/admin/blogs/upload', { method: 'POST', body: uploadData });
      const result = await res.json();

      // Sync to Gallery
      await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          alt: formData.title,
          fileId: result.fileId,
          adminId: user.uid,
          name: file.name
        })
      });

      if (isCover) {
        setFormData({ ...formData, coverImage: { url: result.url, alt: formData.title } });
      } else {
        const responsiveHTML = `<div class="blog-image-wrapper" style="width:100%;margin:2.5rem 0;display:flex;justify-content:center;"><img src="${result.url}" alt="${formData.title || 'Artisan image'}" style="width:100%;height:auto;max-width:100%;border-radius:1rem;display:block;box-shadow:0 8px 32px rgba(0,0,0,0.12);" /></div>`;
        insertAtCursor(responsiveHTML);
      }
      loadGallery();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleInsertGalleryImage = () => {
    if (!pendingGalleryImage) return;

    let html = '';
    const { url, altText } = pendingGalleryImage;
    const baseImgStyle = "width:100%;height:auto;max-width:100%;border-radius:1rem;display:block;box-shadow:0 8px 32px rgba(0,0,0,0.12);";

    if (galleryImageLayout === 'full') {
      html = `<div class="blog-image-wrapper" style="width:100%;margin:2.5rem 0;display:flex;justify-content:center;"><img src="${url}" alt="${altText}" style="${baseImgStyle}" /></div>`;
    } else if (galleryImageLayout === 'float') {
      html = `<div class="blog-image-wrapper" style="width:45%;float:right;margin:1rem 0 1.5rem 2rem;display:block;"><img src="${url}" alt="${altText}" style="${baseImgStyle.replace('8px 32px', '6px 24px')}" /></div>`;
    } else if (galleryImageLayout === 'center') {
      html = `<div class="blog-image-wrapper" style="width:70%;margin:3.5rem auto;display:flex;justify-content:center;"><img src="${url}" alt="${altText}" style="${baseImgStyle.replace('1rem', '1.5rem').replace('8px 32px', '12px 48px')};border:1px solid rgba(0,0,0,0.05);" /></div>`;
    }

    insertAtCursor(html);
    setPendingGalleryImage(null);
    setShowGalleryPicker(false);
  };

  const insertCallout = (type: 'info' | 'warning' | 'success' | 'error') => {
    const configs = {
      info: { bg: '#EFF6FF', border: '#BFDBFE', title: 'Info', titleColor: '#1D4ED8', textColor: '#1E40AF' },
      warning: { bg: '#FFFBEB', border: '#FEF3C7', title: 'Note', titleColor: '#B45309', textColor: '#92400E' },
      success: { bg: '#F0FDF4', border: '#DCFCE7', title: 'Tip', titleColor: '#15803D', textColor: '#166534' },
      error: { bg: '#FEF2F2', border: '#FEE2E2', title: 'Caution', titleColor: '#B91C1C', textColor: '#991B1B' }
    };
    const c = configs[type];
    const html = `
      <div style="padding:1rem 1.25rem;border-radius:0.75rem;margin:1.5rem 0;background:${c.bg};border:1px solid ${c.border};">
        <p style="font-weight:800;color:${c.titleColor};margin:0 0 0.25rem;">${c.title}</p>
        <p style="color:${c.textColor};margin:0;">Write your callout text here...</p>
      </div>
    `;
    insertAtCursor(html);
    setCalloutAnchorEl(null);
  };

  const insertGrid = () => {
    const html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin:2rem 0;">
        <div style="min-height:80px;border:1px dashed #ccc;padding:1rem;border-radius:0.5rem;">Left column content...</div>
        <div style="min-height:80px;border:1px dashed #ccc;padding:1rem;border-radius:0.5rem;">Right column content...</div>
      </div>
    `;
    insertAtCursor(html);
  };

  const seoChecks = useMemo(() => {
    if (!formData) return [];
    return [
      { label: 'Meta title (50-60 chars)', pass: formData.seo?.metaTitle?.length >= 50 && formData.seo?.metaTitle?.length <= 60, tip: `${formData.seo?.metaTitle?.length || 0} chars` },
      { label: 'Meta description (120-160)', pass: formData.seo?.metaDescription?.length >= 120 && formData.seo?.metaDescription?.length <= 160, tip: `${formData.seo?.metaDescription?.length || 0} chars` },
      { label: 'Min 3 keywords', pass: (formData.seo?.metaKeywords?.length || 0) >= 3, tip: `${formData.seo?.metaKeywords?.length || 0} keywords` },
      { label: 'Cover image set', pass: !!formData.coverImage?.url, tip: 'Upload/Choose image' },
      { label: 'Min 3 tags', pass: (formData.tags?.length || 0) >= 3, tip: `${formData.tags?.length || 0} tags` },
      { label: 'Content > 300 words', pass: wordCount > 300, tip: `${wordCount} words` },
      { label: 'URL-friendly slug', pass: /^[a-z0-9-]+$/.test(formData.slug || ''), tip: 'Slug format correct' },
      { label: 'Summary > 120 chars', pass: (formData.excerpt?.length || 0) >= 120, tip: 'Check excerpt length' },
    ];
  }, [formData, wordCount]);

  const seoScore = Math.round((seoChecks.filter(c => c.pass).length / seoChecks.length) * 100);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Blog Studio</Typography>
          <Typography variant="body2" color="text.secondary">Craft artisanal stories and manage your digital heritage archive.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenEditor()} sx={{ borderRadius: 3, px: 4, fontWeight: 800, height: 48 }}>New Article</Button>
      </Stack>

      <Paper sx={{ mb: 4, p: 2, borderRadius: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField size="small" placeholder="Search titles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled' }} /> }} sx={{ flex: 1 }} />
          <Tabs value={statusFilter} onChange={(_, v) => setStatusFilter(v)} sx={{ minHeight: 40 }}>
            <Tab label="All" value="all" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
            <Tab label="Published" value="published" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
            <Tab label="Drafts" value="draft" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
          </Tabs>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1), overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Story</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Classification</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === 'all' || b.status === statusFilter)).map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ position: 'relative', width: 48, height: 48, borderRadius: 2, overflow: 'hidden', bgcolor: alpha('#000', 0.05) }}>
                      <Image src={getCoverImage(row.coverImage?.url)} alt={row.title} fill className="object-cover" sizes="48px" />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.excerpt}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell><Chip label={row.category} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem' }} /></TableCell>
                <TableCell><Chip label={row.status.toUpperCase()} color={row.status === 'published' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem' }} /></TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Duplicate post"><IconButton size="small" onClick={() => { handleOpenEditor(); setFormData({ ...row, _id: undefined, title: `Copy of ${row.title}`, slug: `copy-of-${row.slug}`, status: 'draft' }); }}><Copy size={16} /></IconButton></Tooltip>
                    <IconButton size="small" onClick={() => handleOpenEditor(row)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={async () => { if(confirm('Delete story?')) { await fetch(`/api/admin/blogs/${row._id}?adminId=${user?.uid}`, { method: 'DELETE' }); loadBlogs(); } }}><Delete fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullScreen PaperProps={{ sx: { bgcolor: '#F6F1E9' } }}>
        <DialogTitle sx={{ p: 0, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => setEditorOpen(false)}><Close /></IconButton>
              <Typography variant="h6" fontWeight={900}>{formData?._id ? 'Refine Story' : 'New Creation'}</Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={handleSave} disabled={isSaving} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>
                {formData?.status === 'published' ? 'Sync Archive' : 'Save Draft'}
              </Button>
            </Stack>
          </Stack>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered sx={{ bgcolor: 'white' }}>
            <Tab label="CONTENT" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
            <Tab label="SEO" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
            <Tab label="SETTINGS" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
          </Tabs>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {formData && (
            <Container maxWidth="md">
              {activeTab === 0 && (
                <Stack spacing={4}>
                  <Alert severity="warning" sx={{ borderRadius: 3 }}>
                    ⚠️ Do not include the article title or hero section in the content body. The title and cover image are rendered automatically by the blog template above the content.
                  </Alert>

                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <TextField fullWidth placeholder="Article Title..." variant="standard" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} InputProps={{ style: { fontSize: '2.5rem', fontWeight: 900 }, disableUnderline: true }} />
                    <TextField fullWidth multiline rows={3} placeholder="Article Excerpt (Min 120 chars)..." value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} sx={{ mt: 2 }} />
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, mb: 2, display: 'block' }}>COVER IMAGE</Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Button variant="outlined" startIcon={<CloudUpload />} component="label">Upload<input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, true)} /></Button>
                      <Button variant="outlined" startIcon={<PhotoLibrary />} onClick={() => { setGalleryInsertMode('cover'); loadGallery(); setShowGalleryPicker(true); }}>Choose from Gallery</Button>
                    </Stack>
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 3, overflow: 'hidden', bgcolor: alpha('#000', 0.05) }}>
                      {formData.coverImage?.url && <Image src={formData.coverImage.url} alt="Cover" fill className="object-cover" />}
                    </Box>
                  </Paper>

                  <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                      {/* TOOLBAR ROW 1 */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, px: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value=""
                            displayEmpty
                            onChange={(e) => execFormatting('formatBlock', e.target.value)}
                            sx={{ height: 32, fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            <MenuItem value="p">Paragraph</MenuItem>
                            <MenuItem value="h1">Heading 1</MenuItem>
                            <MenuItem value="h2">Heading 2</MenuItem>
                            <MenuItem value="h3">Heading 3</MenuItem>
                            <MenuItem value="h4">Heading 4</MenuItem>
                            <MenuItem value="blockquote">Blockquote</MenuItem>
                            <MenuItem value="pre">Code Block</MenuItem>
                          </Select>
                        </FormControl>

                        <Divider orientation="vertical" flexItem />

                        <Stack direction="row">
                          <IconButton size="small" onClick={() => execFormatting('bold')}><FormatBold fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => execFormatting('italic')}><FormatItalic fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => execFormatting('underline')}><FormatUnderlined fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => execFormatting('strikeThrough')}><StrikethroughS fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => execFormatting('insertHTML', '<code>' + window.getSelection() + '</code>')}><CodeIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { const url = prompt('Enter URL:'); if(url) execFormatting('createLink', url); }}><LinkIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => execFormatting('removeFormat')}><FormatClear fontSize="small" /></IconButton>
                        </Stack>

                        <Box sx={{ flex: 1 }} />

                        <ToggleButtonGroup size="small" value={editorMode} exclusive onChange={(_, v) => v && setEditorMode(v)}>
                          <ToggleButton value="visual"><EditNote sx={{ mr: 0.5 }} /> Visual</ToggleButton>
                          <ToggleButton value="html"><CodeIcon sx={{ mr: 0.5 }} /> HTML</ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>

                      <Divider />

                      {/* TOOLBAR ROW 2 */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, px: 1 }}>
                        <IconButton size="small" onClick={() => execFormatting('insertUnorderedList')}><FormatListBulleted fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => execFormatting('insertOrderedList')}><FormatListNumbered fontSize="small" /></IconButton>
                        
                        <Divider orientation="vertical" flexItem />

                        <IconButton size="small" onClick={() => { setGalleryInsertMode('content'); loadGallery(); setShowGalleryPicker(true); }}><AddPhotoAlternate fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { setProductAnchorEl(e.currentTarget); setShowProductPicker(true); }}><Package size={18} /></IconButton>
                        <IconButton size="small" onClick={() => insertAtCursor('<hr style="border:none;border-top:2px solid #e5e0d8;margin:2rem 0;" />')}><HorizontalRule fontSize="small" /></IconButton>
                        
                        <IconButton size="small" onClick={(e) => setCalloutAnchorEl(e.currentTarget)}><Message fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={insertGrid}><ViewQuilt fontSize="small" /></IconButton>
                      </Stack>
                    </Box>

                    {editorMode === 'visual' ? (
                      <Box
                        ref={visualEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                        onInput={(e) => setFormData({ ...formData, content: e.currentTarget.innerHTML })}
                        sx={{ 
                          p: 4, 
                          minHeight: 500, 
                          bgcolor: 'white', 
                          outline: 'none',
                          '& h1': { fontSize: '2.2rem', fontWeight: 900, margin: '1.5rem 0 0.75rem', lineHeight: 1.2, fontFamily: 'inherit' },
                          '& h2': { fontSize: '1.7rem', fontWeight: 800, margin: '1.4rem 0 0.6rem', lineHeight: 1.25, color: '#EA781E' },
                          '& h3': { fontSize: '1.35rem', fontWeight: 700, margin: '1.2rem 0 0.5rem' },
                          '& h4': { fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.4rem' },
                          '& p': { fontSize: '1rem', lineHeight: 1.8, margin: '0.75rem 0', color: '#333' },
                          '& ul': { listStyle: 'disc', paddingLeft: '1.75rem', margin: '1rem 0' },
                          '& ol': { listStyle: 'decimal', paddingLeft: '1.75rem', margin: '1rem 0' },
                          '& li': { fontSize: '1rem', lineHeight: 1.7, margin: '0.35rem 0' },
                          '& blockquote': { borderLeft: '4px solid #EA781E', padding: '0.75rem 1.25rem', margin: '1.5rem 0', background: '#FAF4EB', borderRadius: '0 0.75rem 0.75rem 0', fontStyle: 'italic', color: '#5a3e28' },
                          '& strong': { fontWeight: 800 },
                          '& em': { fontStyle: 'italic' },
                          '& a': { color: '#EA781E', textDecoration: 'underline' },
                          '& hr': { border: 'none', borderTop: '2px solid #e5e0d8', margin: '2rem 0' },
                          '& img': { maxWidth: '100%', height: 'auto', borderRadius: '1rem', margin: '1.5rem 0' },
                          '& code': { background: '#f3ede4', padding: '0.15rem 0.4rem', borderRadius: '0.3rem', fontFamily: 'monospace', fontSize: '0.9rem' },
                          '& pre': { background: '#1e1e1e', color: '#f8f8f2', padding: '1.25rem', borderRadius: '0.75rem', overflowX: 'auto', fontSize: '0.875rem' },
                          '& table': { width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0' },
                          '& th': { background: '#f3ede4', fontWeight: 800, padding: '0.75rem 1rem', border: '1px solid #e0d8cc', textAlign: 'left' },
                          '& td': { padding: '0.65rem 1rem', border: '1px solid #e0d8cc' }
                        }}
                      />
                    ) : (
                      <Box sx={{ p: 0, bgcolor: '#1e1e1e' }}>
                        <Typography variant="caption" sx={{ color: '#888', p: 1, display: 'block' }}>Direct HTML editing mode. Changes sync with Visual mode.</Typography>
                        <TextField 
                          fullWidth 
                          multiline 
                          minRows={20} 
                          value={formData.content} 
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                          sx={{ 
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                            '& textarea': { fontFamily: 'monospace', color: '#f8f8f2', fontSize: '14px', p: 4 } 
                          }} 
                        />
                      </Box>
                    )}
                  </Paper>
                </Stack>
              )}

              {activeTab === 1 && (
                <Paper sx={{ p: 4, borderRadius: 4 }}>
                  <Typography variant="h6" fontWeight={900}>SEO Performance ({seoScore}%)</Typography>
                  <LinearProgress variant="determinate" value={seoScore} sx={{ height: 10, borderRadius: 5, my: 2 }} color={seoScore < 50 ? 'error' : 'success'} />
                  <Stack spacing={2.5} sx={{ mb: 4 }}>
                    <TextField fullWidth label="Meta title (50–60 characters)" value={formData.seo?.metaTitle || ''} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value.slice(0, 70) } })} helperText={`${formData.seo?.metaTitle?.length || 0}/60 characters`} />
                    <TextField fullWidth multiline minRows={3} label="Meta description (120–160 characters)" value={formData.seo?.metaDescription || ''} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value.slice(0, 180) } })} helperText={`${formData.seo?.metaDescription?.length || 0}/160 characters`} />
                    <TextField fullWidth label="SEO keywords (comma separated)" value={(formData.seo?.metaKeywords || []).join(', ')} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaKeywords: e.target.value.split(',').map((keyword: string) => keyword.trim()).filter(Boolean).slice(0, 20) } })} helperText="Add at least 3 specific search phrases." />
                    <TextField fullWidth label="Canonical URL (optional)" value={formData.seo?.canonicalUrl || ''} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, canonicalUrl: e.target.value.trim() } })} />
                  </Stack>
                  <List>
                    {seoChecks.map((c, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>
                          {c.pass ? <CheckCircle color="success" /> : <XCircle color="error" />}
                        </ListItemIcon>
                        <ListItemText primary={c.label} secondary={c.tip} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {activeTab === 2 && (
                <Paper sx={{ p: 4, borderRadius: 4 }}>
                  <Stack spacing={4}>
                    <FormControl fullWidth>
                      <InputLabel>Publication status</InputLabel>
                      <Select label="Publication status" value={formData.status || 'draft'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                        <MenuItem value="draft">Draft — keep private</MenuItem>
                        <MenuItem value="published">Published — visible on the blog</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                        {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>Tags</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {formData.tags?.map((t: string, i: number) => (
                          <Chip key={i} label={t} onDelete={() => setFormData({ ...formData, tags: formData.tags.filter((_: any, idx: number) => idx !== i) })} />
                        ))}
                      </Box>
                      <TextField size="small" placeholder="Add tag..." onKeyDown={(e: any) => { if (e.key === 'Enter') { setFormData({ ...formData, tags: [...formData.tags, e.target.value] }); e.target.value = ''; } }} />
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Container>
          )}
        </DialogContent>
      </Dialog>

      {/* Callout Menu */}
      <Menu anchorEl={calloutAnchorEl} open={Boolean(calloutAnchorEl)} onClose={() => setCalloutAnchorEl(null)}>
        <MenuItem onClick={() => insertCallout('info')}><Info sx={{ mr: 1, color: '#1D4ED8' }} /> Info Callout</MenuItem>
        <MenuItem onClick={() => insertCallout('warning')}><Warning sx={{ mr: 1, color: '#B45309' }} /> Warning Callout</MenuItem>
        <MenuItem onClick={() => insertCallout('success')}><CheckCircle sx={{ mr: 1, color: '#15803D' }} /> Success Callout</MenuItem>
        <MenuItem onClick={() => insertCallout('error')}><XCircle sx={{ mr: 1, color: '#B91C1C' }} /> Error Callout</MenuItem>
      </Menu>

      {/* Gallery Picker */}
      <Dialog open={showGalleryPicker} onClose={() => { setShowGalleryPicker(false); setPendingGalleryImage(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {pendingGalleryImage ? 'Configure Image Layout' : 'Artisan Gallery'}
        </DialogTitle>
        <DialogContent dividers>
          {!pendingGalleryImage ? (
            <Grid container spacing={2}>
              {galleryItems.map((item) => (
                <Grid item xs={6} sm={3} key={item._id}>
                  <Box 
                    sx={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer', borderRadius: 2, overflow: 'hidden', border: '2px solid transparent', '&:hover': { borderColor: 'primary.main' } }} 
                    onClick={() => {
                      if (galleryInsertMode === 'content' && editorMode === 'visual') {
                        setPendingGalleryImage(item);
                      } else {
                        setFormData({ ...formData, coverImage: { url: item.url, alt: item.altText } });
                        setShowGalleryPicker(false);
                      }
                    }}
                  >
                    <Image src={item.url} alt={item.altText} fill className="object-cover" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={5}>
                   <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                      <Image src={pendingGalleryImage.url} alt={pendingGalleryImage.altText} fill className="object-cover" />
                   </Box>
                   <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', fontWeight: 700 }}>
                     Preview: {pendingGalleryImage.name}
                   </Typography>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Choose Article Placement:</Typography>
                  <Stack spacing={2}>
                    {[
                      { id: 'full', label: 'Full Width (100%)', icon: <ViewColumn />, desc: 'Spans across the entire content width. Best for landscape shots.' },
                      { id: 'float', label: 'Floating Right (45%)', icon: <ViewWeek />, desc: 'Text wraps around the image. Best for portrait shots on desktop.' },
                      { id: 'center', label: 'Centered Highlight (70%)', icon: <HorizontalRule />, desc: 'Focused centerpiece with extra breathing room and shadow.' },
                    ].map((opt) => (
                      <Paper 
                        key={opt.id}
                        variant="outlined"
                        onClick={() => setGalleryImageLayout(opt.id as any)}
                        sx={{ 
                          p: 2, cursor: 'pointer', borderRadius: 3, 
                          transition: 'all 0.2s',
                          borderColor: galleryImageLayout === opt.id ? 'primary.main' : 'divider',
                          bgcolor: galleryImageLayout === opt.id ? alpha('#EA781E', 0.05) : 'transparent',
                          '&:hover': { bgcolor: alpha('#EA781E', 0.02) }
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ color: galleryImageLayout === opt.id ? 'primary.main' : 'text.disabled' }}>{opt.icon}</Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{opt.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {pendingGalleryImage ? (
            <>
              <Button onClick={() => setPendingGalleryImage(null)}>Back to Gallery</Button>
              <Button variant="contained" onClick={handleInsertGalleryImage} sx={{ borderRadius: 2, fontWeight: 900, px: 4 }}>
                Insert into Article
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowGalleryPicker(false)}>Cancel</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Product Picker */}
      <Popover open={showProductPicker} anchorEl={productAnchorEl} onClose={() => setShowProductPicker(false)}>
        <Box sx={{ p: 2, width: 300 }}>
          <TextField fullWidth size="small" placeholder="Search product..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          <List>
            {productResults.map(p => (
              <ListItem key={p._id} onClick={() => {
                insertAtCursor(`<a href="/products/${p.slug}" class="inline-flex items-center gap-2 px-4 py-2 my-4 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all no-underline">🏺 ${p.name} — ₹${p.price}</a>`);
                setShowProductPicker(false);
              }} sx={{ cursor: 'pointer' }}>
                <ListItemText primary={p.name} secondary={`₹${p.price}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Box>
  );
}
