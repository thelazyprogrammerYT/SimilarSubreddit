"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Reddit API credentials from environment variables
const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = 'SubredditExplorer/1.0';
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Function to get Reddit access token
function getRedditAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post('https://www.reddit.com/api/v1/access_token', 'grant_type=client_credentials', {
                auth: {
                    username: CLIENT_ID,
                    password: CLIENT_SECRET
                },
                headers: {
                    'User-Agent': REDDIT_USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error getting Reddit access token:', error);
            throw error;
        }
    });
}
// API route to get similar subreddits
app.get('/api/similar/:subreddit', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subreddit = req.params.subreddit;
        const accessToken = yield getRedditAccessToken();
        // Get subreddit info
        const subredditResponse = yield axios_1.default.get(`https://oauth.reddit.com/r/${subreddit}/about`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': REDDIT_USER_AGENT
            }
        });
        // Get posts from the subreddit
        const postsResponse = yield axios_1.default.get(`https://oauth.reddit.com/r/${subreddit}/hot?limit=100`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': REDDIT_USER_AGENT
            }
        });
        const posts = postsResponse.data.data.children;
        const relatedSubs = new Map();
        // Analyze posts to find related subreddits
        for (const post of posts) {
            // Skip if it's the same subreddit
            if (post.data.subreddit.toLowerCase() === subreddit.toLowerCase()) {
                continue;
            }
            // Count occurrences of other subreddits
            const subName = post.data.subreddit;
            relatedSubs.set(subName, (relatedSubs.get(subName) || 0) + 1);
        }
        // Sort related subreddits by frequency
        const sortedSubs = Array.from(relatedSubs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        // Get details for each related subreddit
        const relatedSubredditsDetails = yield Promise.all(sortedSubs.map((_a) => __awaiter(void 0, [_a], void 0, function* ([subName]) {
            try {
                const subResponse = yield axios_1.default.get(`https://oauth.reddit.com/r/${subName}/about`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'User-Agent': REDDIT_USER_AGENT
                    }
                });
                const subData = subResponse.data.data;
                return {
                    name: subName,
                    subscribers: subData.subscribers,
                    description: subData.public_description || 'No description available'
                };
            }
            catch (error) {
                console.error(`Error fetching details for r/${subName}:`, error);
                return null;
            }
        })));
        // Filter out any failed requests
        const validSubreddits = relatedSubredditsDetails.filter(sub => sub !== null);
        res.json({ relatedSubreddits: validSubreddits });
    }
    catch (error) {
        console.error('Error fetching similar subreddits:', error);
        res.status(500).json({ error: 'Error fetching similar subreddits' });
    }
}));
// API route for testing
app.get('/api/health', (req, res) => {
    res.json({ message: 'Subreddit Explorer API is running' });
});
// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
exports.default = app;
