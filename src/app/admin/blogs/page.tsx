'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Stack, alpha, useTheme,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Switch, FormControlLabel, Avatar, LinearProgress,
  Tooltip, CircularProgress, Container
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Star, StarBorder, CloudUpload,
  Search, Save, Close, Link as LinkIcon, FormatBold, FormatItalic,
  FormatListBulleted, FormatQuote, Code, AddPhotoAlternate,
  InsertLink, Title
} from '@mui/icons-material';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import Image from 'next/image';

const CATEGORIES = ["Tips", "Heritage", "Product Spotlight", "How-to", "News", "Care Guide"];

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

  const [editingBlog, setEditingBlog] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const loadBlogs = async () => {
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
  };

  useEffect(() => {
    loadBlogs();
  }, [user]);

  const handleOpenEditor = (blog?: any) => {
    if (blog) {
      setEditingBlog({ ...blog });
    } else {
      setEditingBlog({
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
        author: { name: user?.displayName || 'Kalamic Artisan' }
      });
    }
    setActiveTab(0);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editingBlog.title || !editingBlog.content || !user) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Title and Content are required.' });
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = !!editingBlog._id;
      const url = isUpdate ? `/api/admin/blogs/${editingBlog._id}` : '/api/admin/blogs';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingBlog, adminId: user.uid })
      });

      if (!res.ok) throw new Error('Failed to save blog');

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('seoName', editingBlog.title || 'blog-image');

      const res = await fetch('/api/admin/blogs/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (isCover) {
        setEditingBlog({ ...editingBlog, coverImage: { url: result.url, alt: editingBlog.title } });
      } else {
        // Insert into content at cursor
        const textarea = contentInputRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imgTag = `\n<img src="${result.url}" alt="${editingBlog.title}" class="rounded-2xl shadow-lg my-8" />\n<p class="text-center text-xs italic text-muted-foreground mt-2">Caption here</p>\n`;
          const newContent = editingBlog.content.substring(0, start) + imgTag + editingBlog.content.substring(end);
          setEditingBlog({ ...editingBlog, content: newContent });
        }
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
    const selectedText = editingBlog.content.substring(start, end);
    
    let replacement = '';
    if (type === 'wrap') {
      replacement = `<${tag}>${selectedText}</${tag}>`;
    } else if (type === 'block') {
      replacement = `\n<${tag} class="${tag === 'blockquote' ? 'border-l-4 border-primary pl-6 py-4 italic my-8' : ''}">${selectedText || 'New ' + tag}</${tag}>\n`;
    }

    const newContent = editingBlog.content.substring(0, start) + replacement + editingBlog.content.substring(end);
    setEditingBlog({ ...editingBlog, content: newContent });
  };

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    drafts: blogs.filter(b => b.status === 'draft').length,
    views: blogs.reduce((acc, b) => acc + (b.views || 0), 0)
  };

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeoScore = () => {
    if (!editingBlog) return 0;
    let score = 0;
    if (editingBlog.seo?.metaTitle?.length >= 50 && editingBlog.seo?.metaTitle?.length <= 60) score += 25;
    if (editingBlog.seo?.metaDescription?.length >= 120 && editingBlog.seo?.metaDescription?.length <= 160) score += 25;
    if (editingBlog.tags?.length >= 3) score += 25;
    if (editingBlog.coverImage?.url) score += 25;
    return score;
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
                    <Avatar variant="rounded" src={row.coverImage?.url} sx={{ width: 48, height: 48, bgcolor: alpha('#000', 0.05) }} />
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
                    <IconButton size="small" onClick={() => handleOpenEditor(row)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}><Delete fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* BLOG EDITOR DIALOG */}
      <Dialog 
        open={editorOpen} 
        onClose={() => !isSaving && setEditorOpen(false)} 
        fullScreen
        PaperProps={{ sx: { bgcolor: '#F6F1E9' } }}
      >
        <DialogTitle sx={{ p: 0, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => setEditorOpen(false)}><Close /></IconButton>
              <Typography variant="h6" fontWeight={900}>{editingBlog?._id ? 'Refine Story' : 'New Creation'}</Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button onClick={() => setEditorOpen(false)} disabled={isSaving}>Discard</Button>
              <Button 
                variant="contained" 
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
              >
                {editingBlog?.status === 'published' ? 'Sync Archive' : 'Save Draft'}
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
          {editingBlog && (
            <Container maxWidth="md">
              {activeTab === 0 && (
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <TextField 
                      fullWidth 
                      placeholder="Article Title..." 
                      variant="standard"
                      value={editingBlog.title}
                      onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                      InputProps={{ 
                        style: { fontSize: '2.5rem', fontWeight: 900, fontFamily: '"Playfair Display", serif' },
                        disableUnderline: true
                      }}
                    />
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <FormControl size="small" sx={{ width: 200 }}>
                        <InputLabel>Category</InputLabel>
                        <Select 
                          value={editingBlog.category} 
                          label="Category" 
                          onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                        >
                          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField 
                        size="small" 
                        label="Slug" 
                        value={editingBlog.slug || ''} 
                        onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value })}
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
                      {editingBlog.coverImage?.url ? (
                        <img src={editingBlog.coverImage.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      value={editingBlog.coverImage?.alt || ''}
                      onChange={(e) => setEditingBlog({ ...editingBlog, coverImage: { ...editingBlog.coverImage, alt: e.target.value } })}
                      sx={{ mt: 2 }}
                    />
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, mb: 2, display: 'block', color: 'text.secondary' }}>THE STORY EXCERPT</Typography>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={3} 
                      placeholder="A short hook to capture the reader's soul..."
                      value={editingBlog.excerpt}
                      onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value.substring(0, 300) })}
                      helperText={`${editingBlog.excerpt.length}/300 chars`}
                    />
                  </Paper>

                  <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Heading 1"><IconButton size="small" onClick={() => insertFormat('h1', 'block')}><Title /></IconButton></Tooltip>
                        <Tooltip title="Heading 2"><IconButton size="small" onClick={() => insertFormat('h2', 'block')}><Typography sx={{ fontWeight: 900 }}>H2</Typography></IconButton></Tooltip>
                        <Tooltip title="Bold"><IconButton size="small" onClick={() => insertFormat('strong')}><FormatBold /></IconButton></Tooltip>
                        <Tooltip title="Italic"><IconButton size="small" onClick={() => insertFormat('em')}><FormatItalic /></IconButton></Tooltip>
                        <Tooltip title="Quote"><IconButton size="small" onClick={() => insertFormat('blockquote', 'block')}><FormatQuote /></IconButton></Tooltip>
                        <Tooltip title="Insert Image"><IconButton size="small" component="label"><AddPhotoAlternate /><input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, false)} /></IconButton></Tooltip>
                        <Tooltip title="Link"><IconButton size="small" onClick={() => insertFormat('a')}><InsertLink /></IconButton></Tooltip>
                      </Stack>
                    </Box>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={20} 
                      placeholder="Speak your truth..."
                      inputRef={contentInputRef}
                      value={editingBlog.content}
                      onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    />
                    <Box sx={{ p: 2, bgcolor: alpha('#000', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                        {editingBlog.content.split(/\s+/).filter(Boolean).length} words · Estimated {Math.ceil(editingBlog.content.split(/\s+/).filter(Boolean).length / 200)} min read
                      </Typography>
                    </Box>
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
                        <Typography variant="caption" fontWeight={800}>{getSeoScore()}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={getSeoScore()} sx={{ height: 8, borderRadius: 4 }} color={getSeoScore() > 70 ? "success" : "warning"} />
                    </Box>

                    <Stack spacing={3}>
                      <TextField 
                        fullWidth 
                        label="Meta Title" 
                        value={editingBlog.seo?.metaTitle || ''}
                        onChange={(e) => setEditingBlog({ ...editingBlog, seo: { ...editingBlog.seo, metaTitle: e.target.value.substring(0, 60) } })}
                        helperText={`${editingBlog.seo?.metaTitle?.length || 0}/60 (Optimum: 50-60)`}
                      />
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={3} 
                        label="Meta Description" 
                        value={editingBlog.seo?.metaDescription || ''}
                        onChange={(e) => setEditingBlog({ ...editingBlog, seo: { ...editingBlog.seo, metaDescription: e.target.value.substring(0, 160) } })}
                        helperText={`${editingBlog.seo?.metaDescription?.length || 0}/160 (Optimum: 120-160)`}
                      />
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'white' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, mb: 2, display: 'block', color: 'text.secondary' }}>SEARCH ENGINE PREVIEW</Typography>
                    <Box sx={{ border: '1px solid #dfe1e5', borderRadius: '8px', p: 3, maxWidth: 600 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>kalamic.shop › blog › {editingBlog.slug || '...'}</Typography>
                      <Typography variant="h6" sx={{ color: '#1a0dab', fontSize: '1.25rem', '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}>
                        {editingBlog.seo?.metaTitle || editingBlog.title || 'Page Title'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4d5156' }}>
                        {editingBlog.seo?.metaDescription || editingBlog.excerpt || 'Meta description will appear here...'}
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="h6" fontWeight={900} gutterBottom>Publication Protocol</Typography>
                    <Stack spacing={3}>
                      <FormControlLabel 
                        control={<Switch checked={editingBlog.status === 'published'} onChange={(e) => setEditingBlog({ ...editingBlog, status: e.target.checked ? 'published' : 'draft' })} />} 
                        label={<Typography fontWeight={800}>Published to Live Archive</Typography>} 
                      />
                      <FormControlLabel 
                        control={<Switch checked={editingBlog.isFeatured} onChange={(e) => setEditingBlog({ ...editingBlog, isFeatured: e.target.checked })} />} 
                        label={<Typography fontWeight={800}>Highlight on Homepage</Typography>} 
                      />
                      <TextField 
                        fullWidth 
                        label="Tags (Comma separated)" 
                        value={editingBlog.tags?.join(', ') || ''} 
                        onChange={(e) => setEditingBlog({ ...editingBlog, tags: e.target.value.split(',').map(t => t.trim()) })}
                      />
                      <TextField 
                        fullWidth 
                        label="Author Identity" 
                        value={editingBlog.author?.name || ''}
                        onChange={(e) => setEditingBlog({ ...editingBlog, author: { ...editingBlog.author, name: e.target.value } })}
                      />
                    </Stack>
                  </Paper>
                </Stack>
              )}
            </Container>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
