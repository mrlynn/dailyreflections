'use client';

import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';

/**
 * ArticleCard component displays a blog article in a card format
 *
 * @param {Object} props
 * @param {Object} props.article - Article data
 * @param {boolean} props.horizontal - Whether to display the card horizontally (true) or vertically (false)
 */
export default function ArticleCard({ article, horizontal = false }) {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!article) return null;

  const articleTags = Array.isArray(article.tags) ? article.tags : [];
  const authorName = article.author?.name || 'Daily Reflections';

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: horizontal ? { xs: 'column', md: 'row' } : 'column',
        height: '100%'
      }}
    >
      <CardMedia
        component="img"
        sx={{
          width: horizontal ? { xs: '100%', md: 240 } : '100%',
          height: horizontal ? { xs: 200, md: 240 } : 200
        }}
        image={article.coverImage || '/images/blog/default.jpg'}
        alt={article.title}
      />
      <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
        <Box mb={1}>
          <Chip
            label={article.category}
            size="small"
            color="primary"
            sx={{ mr: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {formatDate(article.publishedAt)}
          </Typography>
        </Box>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: horizontal ? '1.25rem' : '1.125rem',
            '&:hover': { color: 'primary.main' }
          }}
        >
          <Link href={`/blog/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {article.title}
          </Link>
        </Typography>
        <Typography
          variant="body2"
          paragraph
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {article.excerpt}
        </Typography>
        <Box mt="auto" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <PersonIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {authorName}
          </Typography>
          <Box>
            {articleTags.slice(0, horizontal ? 3 : 2).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {articleTags.length > (horizontal ? 3 : 2) && (
              <Chip
                label={`+${articleTags.length - (horizontal ? 3 : 2)}`}
                size="small"
                variant="outlined"
                sx={{ mb: 0.5 }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}