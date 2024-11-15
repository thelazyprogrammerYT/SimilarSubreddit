import express, { Express, Request, Response } from 'express';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Reddit API credentials from environment variables
const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = 'SubredditExplorer/1.0';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Function to get Reddit access token
async function getRedditAccessToken(): Promise<string> {
    try {
        const response = await axios.post(
            'https://www.reddit.com/api/v1/access_token',
            'grant_type=client_credentials',
            {
                auth: {
                    username: CLIENT_ID!,
                    password: CLIENT_SECRET!
                },
                headers: {
                    'User-Agent': REDDIT_USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Reddit access token:', error);
        throw error;
    }
}

async function getActiveUsers(subreddit: string, accessToken: string): Promise<string[]> {
    const postsResponse = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/hot?limit=100`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': REDDIT_USER_AGENT
            }
        }
    );

    const users = new Set<string>();
    for (const post of postsResponse.data.data.children) {
        if (post.data.author && post.data.author !== '[deleted]') {
            users.add(post.data.author);
        }
    }

    return Array.from(users);
}

async function getUserSubreddits(username: string, accessToken: string): Promise<Map<string, number>> {
    const subreddits = new Map<string, number>();
    
    try {
        const userPostsResponse = await axios.get(
            `https://oauth.reddit.com/user/${username}/submitted?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': REDDIT_USER_AGENT
                }
            }
        );

        const userCommentsResponse = await axios.get(
            `https://oauth.reddit.com/user/${username}/comments?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': REDDIT_USER_AGENT
                }
            }
        );

        // Process posts
        for (const post of userPostsResponse.data.data.children) {
            const subName = post.data.subreddit;
            subreddits.set(subName, (subreddits.get(subName) || 0) + 2); // Posts count more
        }

        // Process comments
        for (const comment of userCommentsResponse.data.data.children) {
            const subName = comment.data.subreddit;
            subreddits.set(subName, (subreddits.get(subName) || 0) + 1);
        }
    } catch (error) {
        console.error(`Error fetching data for user ${username}:`, error);
    }

    return subreddits;
}

// API route to get similar subreddits
app.get('/api/similar/:subreddit', async (req: Request, res: Response) => {
    try {
        const subreddit = req.params.subreddit;
        const accessToken = await getRedditAccessToken();

        // Get subreddit info to verify it exists
        await axios.get(
            `https://oauth.reddit.com/r/${subreddit}/about`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': REDDIT_USER_AGENT
                }
            }
        );

        // Get active users in the subreddit
        const activeUsers = await getActiveUsers(subreddit, accessToken);
        
        // Aggregate related subreddits from user activity
        const relatedSubs = new Map<string, number>();
        const userAnalysisPromises = activeUsers.slice(0, 10).map(user => 
            getUserSubreddits(user, accessToken)
        );

        const userSubreddits = await Promise.all(userAnalysisPromises);
        
        // Combine all user subreddit data
        for (const userSubs of userSubreddits) {
            for (const [sub, count] of userSubs.entries()) {
                if (sub.toLowerCase() !== subreddit.toLowerCase()) {
                    relatedSubs.set(sub, (relatedSubs.get(sub) || 0) + count);
                }
            }
        }

        // Sort and get top related subreddits
        const sortedSubs = Array.from(relatedSubs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // Get details for each related subreddit
        const relatedSubredditsDetails = await Promise.all(
            sortedSubs.map(async ([subName]) => {
                try {
                    const subResponse = await axios.get(
                        `https://oauth.reddit.com/r/${subName}/about`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'User-Agent': REDDIT_USER_AGENT
                            }
                        }
                    );

                    const subData = subResponse.data.data;
                    return {
                        name: subName,
                        subscribers: subData.subscribers,
                        description: subData.public_description || 'No description available',
                        url: `https://reddit.com/r/${subName}`
                    };
                } catch (error) {
                    console.error(`Error fetching details for r/${subName}:`, error);
                    return null;
                }
            })
        );

        // Filter out any failed requests and limit to top 5
        const validSubreddits = relatedSubredditsDetails
            .filter(sub => sub !== null)
            .slice(0, 5);

        res.json({ relatedSubreddits: validSubreddits });
    } catch (error) {
        console.error('Error fetching similar subreddits:', error);
        res.status(500).json({ error: 'Error fetching similar subreddits' });
    }
});

// API route for testing
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ message: 'Subreddit Explorer API is running' });
});

// Serve index.html for all other routes
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
