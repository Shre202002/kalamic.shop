'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Select, Stack, Typography } from '@mui/material';
import { getAdminReviews, moderateReview } from '@/lib/actions/reviews';
import { useUser } from '@/firebase';

export default function AdminReviewsPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try { setReviews(await getAdminReviews(filter)); } catch (e: any) { setError(e?.message || 'Unable to load reviews.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    if (!user?.uid) return;
    setBusy(reviewId);
    try { await moderateReview(user.uid, reviewId, status); await load(); }
    catch (e: any) { setError(e?.message || 'Unable to update review.'); }
    finally { setBusy(null); }
  };

  return <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={3}>
      <Box><Typography variant="h4">Review Moderation</Typography><Typography color="text.secondary">Approve customer stories before they appear on product pages.</Typography></Box>
      <Select size="small" value={filter} onChange={(e) => setFilter(e.target.value as any)} sx={{ minWidth: 140 }}>
        <MenuItem value="pending">Pending</MenuItem><MenuItem value="approved">Approved</MenuItem><MenuItem value="rejected">Rejected</MenuItem><MenuItem value="all">All reviews</MenuItem>
      </Select>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <CircularProgress /> : reviews.length === 0 ? <Alert severity="info">No reviews in this queue.</Alert> : <Stack spacing={2}>
      {reviews.map((review) => <Card key={review._id}><CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h6">{review.product?.name || 'Product review'}</Typography>
            <Typography variant="body2" color="text.secondary">{review.user_name} · {'★'.repeat(Number(review.rating || 0))} · {review.status}</Typography>
          </Box>
          <Chip label={review.status} color={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'error' : 'warning'} size="small" />
        </Stack>
        <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{review.comment}</Typography>
        {Array.isArray(review.review_images) && review.review_images.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{review.review_images.length} attached media file(s); Gallery activation remains separate.</Typography>}
        {review.status === 'pending' && <Stack direction="row" spacing={1} mt={2}><Button variant="contained" color="success" disabled={busy === review._id} onClick={() => updateStatus(review._id, 'approved')}>Approve</Button><Button variant="outlined" color="error" disabled={busy === review._id} onClick={() => updateStatus(review._id, 'rejected')}>Reject</Button></Stack>}
      </CardContent></Card>)}
    </Stack>}
  </Box>;
}
