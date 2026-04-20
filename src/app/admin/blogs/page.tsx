'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Stack, alpha, useTheme,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Switch, FormControlLabel, Avatar, LinearProgress,
  Tooltip, CircularProgress, Container, Accordion, AccordionSummary, AccordionDetails,
  Popover, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, CloudUpload,
  Search, Save, Close, FormatBold, FormatItalic,
  FormatQuote, AddPhotoAlternate,
  Title, ExpandMore, Code as CodeIcon, EditNote, 
  HorizontalRule, ViewColumn, ViewWeek, Info, Warning, CheckCircle, Error as XCircle
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
  const [tagInput, setTagInput] = useState('');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productAnchorEl, setProductAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    return formData?.content?.split(/\s+/).filter(Boolean).length || 0;
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

  useEffect(() => {
    if (!editorOpen || !formData) return;
    const timer = setTimeout(() => {
      localStorage.setItem('blog_draft_autosave', JSON.stringify(formData));
    }, 10000);
    return () => clearTimeout(timer);
  }, [formData, editorOpen]);

  const handleOpenEditor = (blog?: any) => {
    const draft = localStorage.getItem('blog_draft_autosave');
    if (blog) {
      setFormData({ ...blog });
      setSlugManuallyEdited(true);
    } else {
      if (draft) {
        setSavedDraft(JSON.parse(draft));
        setRestoreDialogOpen(true);
      }
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

  const handleRestoreDraft = () => {
    if (savedDraft) {
      setFormData(savedDraft);
      setRestoreDialogOpen(false);
      setSavedDraft(null);
    }
  };

  const handleClonePost = (post: any) => {
    setFormData({
      ...post,
      _id: undefined,
      title: `Copy of ${post.title}`,
      slug: `copy-of-${post.slug}`,
      status: 'draft',
      isFeatured: false,
      publishedAt: null,
      scheduledAt: null,
      views: 0,
    });
    setSlugManuallyEdited(false);
    setEditorOpen(true);
    setActiveTab(0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content || '';
    
    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !user) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Title and Content are required.' });
      return;
    }

    setIsSaving(true);
    try {
      let finalSlug = formData.slug;
      const slugCheckUrl = `/api/admin/blogs/check-slug?slug=${encodeURIComponent(finalSlug)}${formData._id ? `&excludeId=${formData._id}` : ''}`;
      const checkRes = await fetch(slugCheckUrl);
      const checkData = await checkRes.json();
      
      if (checkData.exists) {
        let count = 1;
        let unique = false;
        while(!unique) {
          const testSlug = `${formData.slug}-${count}`;
          const r = await fetch(`/api/admin/blogs/check-slug?slug=${encodeURIComponent(testSlug)}`);
          const d = await r.json();
          if (!d.exists) {
            finalSlug = testSlug;
            unique = true;
          }
          count++;
        }
      }

      const isUpdate = !!formData._id;
      const url = isUpdate ? `/api/admin/blogs/${formData._id}` : '/api/admin/blogs';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          slug: finalSlug,
          adminId: user.uid,
          scheduledAt: formData.scheduledAt || null
        })
      });

      if (!res.ok) throw new Error('Failed to save blog');

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

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Permanently delete this article?')) return;
    try {
      await fetch(`/api/admin/blogs/${id}?adminId=${user.uid}`, { method: 'DELETE' });
      toast({ title: 'Article Deleted' });
      loadBlogs();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = true) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('seoName', formData.title || 'blog-image');

      const res = await fetch('/api/admin/blogs/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const result = await res.json();

      if (isCover) {
        setFormData({ ...formData, coverImage: { url: result.url, alt: formData.title } });
      } else {
        const imgTag = `\n<img src="${result.url}" alt="${formData.title}" class="rounded-2xl shadow-lg my-8" />\n<p class="text-center text-xs italic text-muted-foreground mt-2">Caption here</p>\n`;
        insertAtCursor(imgTag);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  };

  const insertFormat = (tag: string, type: 'wrap' | 'block' = 'wrap') => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let replacement = '';
    if (type === 'wrap') {
      replacement = `<${tag}>${selectedText}</${tag}>`;
    } else if (type === 'block') {
      replacement = `\n<${tag} class="${tag === 'blockquote' ? 'border-l-4 border-primary pl-6 py-4 italic my-8' : ''}">${selectedText || 'New ' + tag}</${tag}>\n`;
    }

    const newContent = formData.content.substring(0, start) + replacement + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });
  };

  const seoChecks = useMemo(() => {
    if (!formData) return [];
    return [
      {
        label: 'Meta title length (50-60 chars)',
        pass: formData.seo?.metaTitle?.length >= 50 && formData.seo?.metaTitle?.length <= 60,
        tip: `Currently: ${formData.seo?.metaTitle?.length || 0} chars`
      },
      {
        label: 'Meta description (120-160 chars)',
        pass: formData.seo?.metaDescription?.length >= 120 && formData.seo?.metaDescription?.length <= 160,
        tip: `Currently: ${formData.seo?.metaDescription?.length || 0} chars`
      },
      {
        label: 'At least 3 keywords',
        pass: (formData.seo?.metaKeywords?.length || 0) >= 3,
        tip: `Currently: ${formData.seo?.metaKeywords?.length || 0} keywords`
      },
      {
        label: 'Cover image set',
        pass: !!formData.coverImage?.url,
        tip: 'Upload a cover image'
      },
      {
        label: 'At least 3 tags',
        pass: (formData.tags?.length || 0) >= 3,
        tip: `Currently: ${formData.tags?.length || 0} tags`
      },
      {
        label: 'Content > 300 words',
        pass: wordCount > 300,
        tip: `Currently: ${wordCount} words`
      },
      {
        label: 'Slug is URL-friendly',
        pass: /^[a-z0-9-]+$/.test(formData.slug || ''),
        tip: 'Slug should only have lowercase, numbers and hyphens'
      },
      {
        label: 'Excerpt filled',
        pass: (formData.excerpt?.length || 0) > 50,
        tip: 'Add a summary excerpt'
      },
    ];
  }, [formData, wordCount]);

  const seoScore = useMemo(() => {
    if (!seoChecks.length) return 0;
    return Math.round((seoChecks.filter(c => c.pass).length / seoChecks.length) * 100);
  }, [seoChecks]);

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    drafts: blogs.filter(b => b.status === 'draft').length,
    views: blogs.reduce((acc, b) => acc + (b.views || 0), 0)
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Blog Studio</Typography>
          <Typography variant="body2" color="text.secondary">Craft artisanal stories and manage your digital heritage archive.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpenEditor()}
          sx={{ borderRadius: 3, px: 4, fontWeight: 800, height: 48 }}
        >
          New Article
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Total Stories', value: stats.total, color: 'primary' },
          { label: 'Live Archive', value: stats.published, color: 'success' },
          { label: 'Drafts', value: stats.drafts, color: 'warning' },
          { label: 'Total Readers', value: stats.views, color: 'info' }
        ].map((s, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: `${s.color}.main` }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mb: 4, p: 2, borderRadius: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField 
            size="small" 
            placeholder="Search titles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled' }} /> }}
            sx={{ flex: 1 }}
          />
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
              <TableCell sx={{ fontWeight: 800 }}>Readers</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Published</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBlogs.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>The archive is silent. Create a new story.</TableCell></TableRow>
            ) : filteredBlogs.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ position: 'relative', width: 48, height: 48, borderRadius: 2, overflow: 'hidden', bgcolor: alpha('#000', 0.05) }}>
                      <Image 
                        src={getCoverImage(row.coverImage?.url)} 
                        alt={row.title} 
                        fill 
                        className="object-cover" 
                        sizes="48px"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.excerpt}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={row.category} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={row.status.toUpperCase()} 
                    color={row.status === 'published' ? 'success' : 'warning'} 
                    size="small" 
                    sx={{ fontWeight: 900, fontSize: '0.6rem' }} 
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{row.views || 0}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.publishedAt ? dayjs(row.publishedAt).format('DD MMM YYYY') : '—'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Duplicate post">
                      <IconButton size="small" onClick={() => handleClonePost(row)}><Copy size={16} /></IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleOpenEditor(row)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}><Delete fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={editorOpen} 
        onClose={() => {
          localStorage.removeItem('blog_draft_autosave');
          setEditorOpen(false);
        }} 
        fullScreen
        PaperProps={{ sx: { bgcolor: '#F6F1E9' } }}
      >
        <DialogTitle sx={{ p: 0, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => {
                localStorage.removeItem('blog_draft_autosave');
                setEditorOpen(false);
              }}><Close /></IconButton>
              <Typography variant="h6" fontWeight={900}>{formData?._id ? 'Refine Story' : 'New Creation'}</Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button onClick={() => {
                localStorage.removeItem('blog_draft_autosave');
                setEditorOpen(false);
              }} disabled={isSaving}>Discard</Button>
              <Button 
                variant="contained" 
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
              >
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
                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <TextField 
                      fullWidth 
                      placeholder="Article Title..." 
                      variant="standard"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      InputProps={{ 
                        style: { fontSize: '2.5rem', fontWeight: 900, fontFamily: '"Playfair Display", serif' },
                        disableUnderline: true
                      }}
                    />
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <FormControl size="small" sx={{ width: 200 }}>
                        <InputLabel>Category</InputLabel>
                        <select 
                          value={formData.category} 
                          className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </FormControl>
                      <TextField 
                        size="small" 
                        label="Slug" 
                        value={formData.slug || ''} 
                        onChange={(e) => {
                          setSlugManuallyEdited(true);
                          setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                        }}
                        helperText="Permanent identifier for URLs"
                      />
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, mb: 2, display: 'block', color: 'text.secondary' }}>COVER IMAGE</Typography>
                    <Box 
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ 
                        aspectRatio: '16/9', 
                        borderRadius: 3, 
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: '2px dashed',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      {formData.coverImage?.url ? (
                        <Image 
                          src={formData.coverImage.url} 
                          alt={formData.title} 
                          fill 
                          className="object-cover"
                          sizes="(max-width: 1200px) 100vw, 800px"
                        />
                      ) : (
                        <>
                          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5, mb: 1 }} />
                          <Typography variant="caption" fontWeight={800}>Select Hero Visual</Typography>
                        </>
                      )}
                      {uploading && <CircularProgress sx={{ position: 'absolute' }} />}
                    </Box>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleUpload(e, true)} />
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Alternative Text (for accessibility)" 
                      value={formData.coverImage?.alt || ''}
                      onChange={(e) => setFormData({ ...formData, coverImage: { ...formData.coverImage, alt: e.target.value } })}
                      sx={{ mt: 2 }}
                    />
                  </Paper>

                  <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Button 
                          size="small" 
                          startIcon={<EditNote />} 
                          variant={editorMode === 'visual' ? 'contained' : 'text'}
                          onClick={() => setEditorMode('visual')}
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        >
                          Visual
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<CodeIcon />} 
                          variant={editorMode === 'html' ? 'contained' : 'text'}
                          onClick={() => setEditorMode('html')}
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        >
                          HTML
                        </Button>
                      </Stack>
                      {editorMode === 'visual' && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Heading 1"><IconButton size="small" onClick={() => insertFormat('h1', 'block')}><Title /></IconButton></Tooltip>
                          <Tooltip title="Heading 2"><IconButton size="small" onClick={() => insertFormat('h2', 'block')}><Typography sx={{ fontWeight: 900 }}>H2</Typography></IconButton></Tooltip>
                          <Tooltip title="Bold"><IconButton size="small" onClick={() => insertFormat('strong')}><FormatBold /></IconButton></Tooltip>
                          <Tooltip title="Italic"><IconButton size="small" onClick={() => insertFormat('em')}><FormatItalic /></IconButton></Tooltip>
                          <Tooltip title="Quote"><IconButton size="small" onClick={() => insertFormat('blockquote', 'block')}><FormatQuote /></IconButton></Tooltip>
                          <Tooltip title="Insert Image"><IconButton size="small" component="label"><AddPhotoAlternate /><input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, false)} /></IconButton></Tooltip>
                          <Tooltip title="Insert Product"><IconButton size="small" onClick={(e) => { setProductAnchorEl(e.currentTarget); setShowProductPicker(true); }}><Package size={18} /></IconButton></Tooltip>
                          <Tooltip title="Divider"><IconButton size="small" onClick={() => insertAtCursor('\n<hr class="my-8 border-primary/20" />\n')}><HorizontalRule /></IconButton></Tooltip>
                        </Stack>
                      )}
                    </Box>
                    
                    {editorMode === 'visual' && (
                      <Box sx={{ p: 1, bgcolor: alpha('#000', 0.02), borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button size="small" variant="outlined" startIcon={<ViewColumn />} onClick={() => insertAtCursor('\n<div class="grid grid-cols-2 gap-8 my-8"><div><p>Left column content here...</p></div><div><img src="IMAGE_URL" alt="description" class="w-full rounded-2xl" /></div></div>')} sx={{ textTransform: 'none', fontSize: '0.65rem' }}>2-Col</Button>
                          <Button size="small" variant="outlined" startIcon={<ViewWeek />} onClick={() => insertAtCursor('\n<div class="grid grid-cols-3 gap-6 my-8"><div class="text-center p-4 rounded-2xl bg-primary/5"><p class="font-bold">Column 1</p></div><div class="text-center p-4 rounded-2xl bg-primary/5"><p class="font-bold">Column 2</p></div><div class="text-center p-4 rounded-2xl bg-primary/5"><p class="font-bold">Column 3</p></div></div>')} sx={{ textTransform: 'none', fontSize: '0.65rem' }}>3-Col</Button>
                          <Button size="small" variant="outlined" startIcon={<Info />} onClick={() => insertAtCursor('\n<div class="my-6 p-5 rounded-2xl bg-blue-50 border border-blue-200"><p class="font-bold text-blue-800 mb-1">ℹ️ Info</p><p class="text-blue-700">Your information here...</p></div>')} sx={{ textTransform: 'none', fontSize: '0.65rem' }}>Info Box</Button>
                          <Button size="small" variant="outlined" startIcon={<Warning />} onClick={() => insertAtCursor('\n<div class="my-6 p-5 rounded-2xl bg-yellow-50 border border-yellow-200"><p class="font-bold text-yellow-800 mb-1">⚠️ Note</p><p class="text-yellow-700">Your note here...</p></div>')} sx={{ textTransform: 'none', fontSize: '0.65rem' }}>Warning</Button>
                          <Button size="small" variant="outlined" startIcon={<CheckCircle />} onClick={() => insertAtCursor('\n<div class="my-6 p-5 rounded-2xl bg-green-50 border border-green-200"><p class="font-bold text-green-800 mb-1">✅ Tip</p><p class="text-green-700">Your tip here...</p></div>')} sx={{ textTransform: 'none', fontSize: '0.65rem' }}>Success</Button>
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ position: 'relative' }}>
                      {editorMode === 'html' && (
                        <Box sx={{ p: 1, bgcolor: '#271E1B', color: '#EA781E', textAlign: 'center' }}>
                          <Typography variant="caption" fontWeight={800}>Direct HTML editing mode. Changes sync with Visual mode.</Typography>
                        </Box>
                      )}
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={20} 
                        placeholder={editorMode === 'html' ? "<!-- Write raw HTML here -->" : "Speak your truth..."}
                        inputRef={contentInputRef}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        sx={{ 
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& textarea': { 
                            fontFamily: 'monospace', 
                            fontSize: '14px',
                            minHeight: '500px'
                          } 
                        }}
                      />
                    </Box>

                    <Box sx={{ p: 2, bgcolor: alpha('#000', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                        {wordCount} words · Estimated {readTime} min read
                      </Typography>
                    </Box>

                    <Accordion sx={{ boxShadow: 'none', borderTop: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="caption" fontWeight={900}>👁 PREVIEW (CLICK TO EXPAND)</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'white' }}>
                          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', mb: 4, borderRadius: 4, overflow: 'hidden', bgcolor: alpha('#000', 0.05) }}>
                            <Image 
                              src={getCoverImage(formData.coverImage?.url)} 
                              alt={formData.title || 'Preview cover'} 
                              fill 
                              className="object-cover" 
                              sizes="(max-width: 1200px) 100vw, 800px"
                            />
                          </Box>
                          <div 
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }}
                          />
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="h6" fontWeight={900} gutterBottom>Discovery Performance</Typography>
                    <Box sx={{ mb: 4 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="caption" fontWeight={800}>SEO Readiness</Typography>
                        <Typography variant="caption" fontWeight={800}>{seoScore}%</Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={seoScore} 
                        sx={{ height: 8, borderRadius: 4 }} 
                        color={seoScore < 50 ? "error" : seoScore < 75 ? "warning" : "success"} 
                      />
                    </Box>

                    <List sx={{ mb: 4 }}>
                      {seoChecks.map((check, i) => (
                        <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {check.pass ? <CheckCircle color="success" sx={{ fontSize: 18 }} /> : <XCircle color="error" sx={{ fontSize: 18 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={<Typography variant="body2" fontWeight={700}>{check.label}</Typography>}
                            secondary={<Typography variant="caption">{check.tip}</Typography>}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Stack spacing={3}>
                      <TextField 
                        fullWidth 
                        label="Meta Title" 
                        value={formData.seo?.metaTitle || ''}
                        onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value.substring(0, 60) } })}
                        helperText={`${formData.seo?.metaTitle?.length || 0}/60 (Optimum: 50-60)`}
                      />
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={3} 
                        label="Meta Description" 
                        value={formData.seo?.metaDescription || ''}
                        onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value.substring(0, 160) } })}
                        helperText={`${formData.seo?.metaDescription?.length || 0}/160 (Optimum: 120-160)`}
                      />
                    </Stack>
                  </Paper>
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="h6" fontWeight={900} gutterBottom>Publication Protocol</Typography>
                    <Stack spacing={3}>
                      <FormControlLabel 
                        control={<Switch checked={formData.status === 'published'} onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'published' : 'draft' })} />} 
                        label={<Typography fontWeight={800}>Published to Live Archive</Typography>} 
                      />

                      {formData.status === 'draft' && (
                        <Box sx={{ mt: 1, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={!!formData.scheduledAt}
                                onChange={e => {
                                  if (e.target.checked) {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    tomorrow.setHours(9, 0, 0, 0);
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      scheduledAt: tomorrow.toISOString().slice(0, 16)
                                    }));
                                  } else {
                                    setFormData((prev: any) => ({ ...prev, scheduledAt: null }));
                                  }
                                }}
                              />
                            }
                            label={<Typography variant="body2" fontWeight={800}>Schedule for later</Typography>}
                          />
                          {formData.scheduledAt && (
                            <TextField
                              type="datetime-local"
                              size="small"
                              fullWidth
                              value={formData.scheduledAt}
                              onChange={e => setFormData((prev: any) => ({ ...prev, scheduledAt: e.target.value }))}
                              sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              helperText="Post will auto-publish at this time"
                            />
                          )}
                        </Box>
                      )}

                      <FormControlLabel 
                        control={<Switch checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />} 
                        label={<Typography fontWeight={800}>Highlight on Homepage</Typography>} 
                      />
                      
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>Tags</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                          {formData.tags?.map((tag: string, i: number) => (
                            <Chip
                              key={i}
                              label={tag}
                              size="small"
                              onDelete={() => {
                                setFormData((prev: any) => ({
                                  ...prev,
                                  tags: prev.tags.filter((_: any, idx: number) => idx !== i)
                                }));
                              }}
                              sx={{ 
                                bgcolor: alpha('#EA781E', 0.1),
                                color: '#EA781E',
                                fontWeight: 700,
                                '& .MuiChip-deleteIcon': { color: '#EA781E' }
                              }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
                                if (newTag && !formData.tags?.includes(newTag)) {
                                  setFormData((prev: any) => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                                }
                                setTagInput('');
                              }
                              if (e.key === 'Backspace' && !tagInput && formData.tags?.length > 0) {
                                setFormData((prev: any) => ({ ...prev, tags: prev.tags.slice(0, -1) }));
                              }
                            }}
                            placeholder="Type tag + Enter"
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const newTag = tagInput.trim().toLowerCase();
                              if (newTag && !formData.tags?.includes(newTag)) {
                                setFormData((prev: any) => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                              }
                              setTagInput('');
                            }}
                            sx={{ borderRadius: 2, flexShrink: 0 }}
                          >
                            Add
                          </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary">Press Enter or comma to add a tag</Typography>
                      </Box>

                      <TextField 
                        fullWidth 
                        label="Author Identity" 
                        value={formData.author?.name || ''}
                        onChange={(e) => setFormData({ ...formData, author: { ...formData.author, name: e.target.value } })}
                      />
                    </Stack>
                  </Paper>
                </Stack>
              )}
            </Container>
          )}
        </DialogContent>
      </Dialog>

      <Popover
        open={showProductPicker}
        anchorEl={productAnchorEl}
        onClose={() => setShowProductPicker(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { p: 2, width: 320, borderRadius: 3, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}
      >
        <Typography variant="caption" fontWeight={900} sx={{ mb: 1, display: 'block' }}>LINK ARTISAN PIECE</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search catalog..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          autoFocus
          InputProps={{ startAdornment: <Search sx={{ fontSize: 18, mr: 1, color: 'text.disabled' }} /> }}
        />
        <List sx={{ mt: 1 }}>
          {productResults.length === 0 ? (
            <Typography variant="caption" sx={{ p: 2, display: 'block', textAlign: 'center', color: 'text.disabled' }}>
              {productSearch ? 'No pieces found' : 'Start typing to search...'}
            </Typography>
          ) : productResults.map((product) => (
            <ListItem 
              key={product._id} 
              disablePadding 
              sx={{ mb: 1 }}
              secondaryAction={
                <Button 
                  size="small" 
                  onClick={() => {
                    insertAtCursor(`\n<a href="/products/${product.slug}" class="inline-flex items-center gap-2 px-4 py-2 my-2 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all no-underline">🏺 ${product.name} — ₹${product.price}</a>\n`);
                    setShowProductPicker(false);
                    setProductSearch('');
                  }}
                >
                  Insert
                </Button>
              }
            >
              <ListItemAvatar>
                <Box sx={{ position: 'relative', width: 40, height: 40, borderRadius: 1, overflow: 'hidden' }}>
                  <Image 
                    src={product.images?.[0]?.url || "https://placehold.co/100x100?text=🏺"} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                  />
                </Box>
              </ListItemAvatar>
              <ListItemText 
                primary={<Typography variant="caption" fontWeight={800} noWrap>{product.name}</Typography>}
                secondary={<Typography variant="caption">₹{product.price}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      </Popover>

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Restore Draft?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">We found an unsaved draft from your previous session. Would you like to restore it?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            localStorage.removeItem('blog_draft_autosave');
            setRestoreDialogOpen(false);
          }}>Ignore</Button>
          <Button variant="contained" onClick={handleRestoreDraft} sx={{ borderRadius: 2, fontWeight: 800 }}>Restore</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
