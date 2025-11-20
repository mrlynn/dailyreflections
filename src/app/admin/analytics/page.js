'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

// Mock chart components (in a real implementation, you would use a charting library like Chart.js or recharts)
function LineChart({ title, data }) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Box
        sx={{
          height: 200,
          background: 'linear-gradient(45deg, rgba(66, 66, 255, 0.15) 0%, rgba(0, 150, 136, 0.15) 100%)',
          borderRadius: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mock line chart */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%',
            borderTop: '2px solid #3f51b5',
            background: 'linear-gradient(180deg, rgba(63, 81, 181, 0.2) 0%, rgba(63, 81, 181, 0) 100%)',
          }}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {data.description}
        </Typography>
      </Box>
    </Box>
  );
}

function PieChart({ title, data }) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Box
        sx={{
          height: 200,
          borderRadius: '50%',
          background: 'conic-gradient(#3f51b5 0% 30%, #f50057 30% 55%, #ff9800 55% 70%, #4caf50 70% 100%)',
          position: 'relative',
          margin: '0 auto',
          width: 200,
        }}
      />
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {data.description}
        </Typography>
      </Box>
    </Box>
  );
}

function BarChart({ title, data }) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        {/* Mock bar chart with 7 bars */}
        {[70, 45, 85, 60, 75, 90, 50].map((height, index) => (
          <Box
            key={index}
            sx={{
              height: `${height}%`,
              width: '12%',
              backgroundColor: index % 2 === 0 ? '#3f51b5' : '#f50057',
              borderRadius: '4px 4px 0 0',
            }}
          />
        ))}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {data.description}
        </Typography>
      </Box>
    </Box>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    userStats: {},
    contentStats: {},
    chatbotStats: {},
    topReflections: [],
    topChatQueries: [],
  });

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    // In a real implementation, this would call an API
    // For now, we'll simulate with mock data
    setTimeout(() => {
      setStats({
        userStats: {
          totalUsers: 1247,
          activeUsers: 432,
          newUsers: 86,
          returnRate: '67%',
          usersGrowth: '+12.5%',
        },
        contentStats: {
          totalComments: 3862,
          commentsToday: 124,
          averageCommentsPerDay: 118,
          commentGrowth: '+8.3%',
        },
        chatbotStats: {
          totalQueries: 7563,
          queriesPerDay: 245,
          responseAccuracy: '87%',
          topicDistribution: [
            { name: 'Steps', value: 35 },
            { name: 'Sobriety', value: 25 },
            { name: 'Reflections', value: 20 },
            { name: 'Other', value: 20 },
          ],
        },
        topReflections: [
          { date: '01-01', title: 'New Year Reflection', views: 1245, comments: 87 },
          { date: '03-15', title: 'Acceptance', views: 876, comments: 62 },
          { date: '05-10', title: 'Gratitude', views: 752, comments: 58 },
          { date: '07-04', title: 'Freedom', views: 687, comments: 53 },
          { date: '09-22', title: 'Serenity', views: 621, comments: 49 },
        ],
        topChatQueries: [
          { query: 'What are the 12 steps?', count: 142 },
          { query: 'How do I stay sober?', count: 98 },
          { query: 'What does today\'s reflection mean?', count: 87 },
          { query: 'Steps to make amends', count: 76 },
          { query: 'Understanding higher power', count: 64 },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateReport = () => {
    // In a real implementation, this would generate a downloadable report
    alert('Report generation initiated. The report will be sent to your email.');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
          Analytics & Reports
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={generateReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 4, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="Overview" />
            <Tab label="User Activity" />
            <Tab label="Content Metrics" />
            <Tab label="Chatbot Analytics" />
          </Tabs>

          <FormControl variant="outlined" size="small" sx={{ width: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="alltime">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Stats Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Total Users</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats.userStats.totalUsers.toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">{stats.userStats.usersGrowth} this month</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Active Users</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats.userStats.activeUsers.toLocaleString()}</Typography>
                    <Typography variant="caption">Return Rate: {stats.userStats.returnRate}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Total Comments</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats.contentStats.totalComments.toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">{stats.contentStats.commentGrowth} this month</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Chatbot Queries</Typography>
                    <Typography variant="h4" fontWeight={700}>{stats.chatbotStats.totalQueries.toLocaleString()}</Typography>
                    <Typography variant="caption">{stats.chatbotStats.queriesPerDay} per day</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <LineChart
                title="User Activity Over Time"
                data={{ description: 'Shows daily active users over the selected time period' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <PieChart
                title="Chatbot Query Topics"
                data={{ description: 'Distribution of chatbot queries by topic category' }}
              />
            </Paper>
          </Grid>

          {/* Top Content Tables */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Reflections</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.topReflections.map((reflection) => (
                      <TableRow key={reflection.date}>
                        <TableCell>{reflection.date}</TableCell>
                        <TableCell>{reflection.title}</TableCell>
                        <TableCell align="right">{reflection.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{reflection.comments}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Chatbot Queries</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Query</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.topChatQueries.map((query) => (
                      <TableRow key={query.query}>
                        <TableCell>{query.query}</TableCell>
                        <TableCell align="right">{query.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* User Activity Tab */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <LineChart
                title="User Registrations Over Time"
                data={{ description: 'New user sign-ups over the selected period' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <PieChart
                title="User Engagement"
                data={{ description: 'Active vs. inactive users' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>User Activity</Typography>
              <BarChart
                title="User Sessions by Day of Week"
                data={{ description: 'Number of active sessions per day' }}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Content Metrics Tab */}
      {activeTab === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <LineChart
                title="Comments Over Time"
                data={{ description: 'Daily comment count over the selected period' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <BarChart
                title="Most Popular Reflections"
                data={{ description: 'Top 7 reflections by view count' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Content Engagement</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Comments</TableCell>
                      <TableCell align="right">Engagement Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['January', 'February', 'March', 'April', 'May'].map((month, index) => (
                      <TableRow key={month}>
                        <TableCell>{month}</TableCell>
                        <TableCell align="right">{(1000 * (5 - index)).toLocaleString()}</TableCell>
                        <TableCell align="right">{(120 * (5 - index)).toLocaleString()}</TableCell>
                        <TableCell align="right">{(12 - index)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Chatbot Analytics Tab */}
      {activeTab === 3 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <LineChart
                title="Chatbot Queries Over Time"
                data={{ description: 'Daily chatbot usage over the selected period' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <PieChart
                title="Query Categories"
                data={{ description: 'Distribution of queries by topic' }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Response Metrics</Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">Response Accuracy</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box
                    sx={{
                      width: '87%',
                      height: 20,
                      backgroundColor: 'primary.main',
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>87%</Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">User Satisfaction</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box
                    sx={{
                      width: '92%',
                      height: 20,
                      backgroundColor: 'success.main',
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>92%</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2">Query Resolution Rate</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box
                    sx={{
                      width: '78%',
                      height: 20,
                      backgroundColor: 'info.main',
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>78%</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Query Types</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Query Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>AA Steps Questions</TableCell>
                      <TableCell align="right">2,765</TableCell>
                      <TableCell align="right">36.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Daily Reflection Meaning</TableCell>
                      <TableCell align="right">1,892</TableCell>
                      <TableCell align="right">25.0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Recovery Tips</TableCell>
                      <TableCell align="right">1,324</TableCell>
                      <TableCell align="right">17.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Big Book Questions</TableCell>
                      <TableCell align="right">984</TableCell>
                      <TableCell align="right">13.0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other</TableCell>
                      <TableCell align="right">598</TableCell>
                      <TableCell align="right">8.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}