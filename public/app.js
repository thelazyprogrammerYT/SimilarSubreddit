// Client-side JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedSubreddit = document.getElementById('selectedSubreddit');
    const similarResults = document.getElementById('similarResults');
    let timeoutId = null;

    // Function to search subreddits
    async function searchSubreddits(query) {
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`https://www.reddit.com/api/search_reddit_names.json?query=${query}&include_over_18=false`, {
                headers: {
                    'User-Agent': 'SubredditExplorer/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            displayResults(data.names || []);
        } catch (error) {
            console.error('Error fetching subreddits:', error);
            searchResults.innerHTML = '<div class="error">Error fetching subreddits</div>';
        }
    }

    // Function to fetch similar subreddits
    async function fetchSimilarSubreddits(subreddit) {
        try {
            similarResults.innerHTML = '<div class="loading">Finding similar subreddits...</div>';
            const response = await fetch(`/api/similar/${subreddit}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            displaySimilarSubreddits(data.relatedSubreddits);
        } catch (error) {
            console.error('Error fetching similar subreddits:', error);
            similarResults.innerHTML = '<div class="error">Error fetching similar subreddits</div>';
        }
    }

    // Function to display similar subreddits
    function displaySimilarSubreddits(subreddits) {
        similarResults.innerHTML = '';
        
        if (!subreddits || subreddits.length === 0) {
            similarResults.innerHTML = '<div class="no-results">No similar subreddits found</div>';
            return;
        }

        subreddits.forEach(subreddit => {
            const div = document.createElement('div');
            div.className = 'similar-result';
            
            const nameLink = document.createElement('a');
            nameLink.href = subreddit.url;
            nameLink.target = '_blank';
            nameLink.rel = 'noopener noreferrer';
            
            const name = document.createElement('h4');
            name.textContent = `r/${subreddit.name}`;
            nameLink.appendChild(name);
            
            const subscribers = document.createElement('p');
            subscribers.className = 'subscribers';
            subscribers.textContent = `${formatSubscribers(subreddit.subscribers)} subscribers`;
            
            const description = document.createElement('p');
            description.className = 'description';
            description.textContent = subreddit.description || 'No description available';
            
            div.appendChild(nameLink);
            div.appendChild(subscribers);
            div.appendChild(description);

            // Add click event to the entire div for better UX
            div.addEventListener('click', (e) => {
                if (!e.target.closest('a')) {
                    window.open(subreddit.url, '_blank', 'noopener noreferrer');
                }
            });
            
            similarResults.appendChild(div);
        });
    }

    // Function to format subscriber count
    function formatSubscribers(count) {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }

    // Function to display search results
    function displayResults(subreddits) {
        searchResults.innerHTML = '';
        
        if (subreddits.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No subreddits found</div>';
            return;
        }

        subreddits.forEach(subreddit => {
            const div = document.createElement('div');
            div.className = 'search-result';
            div.textContent = subreddit;
            div.addEventListener('click', () => {
                selectedSubreddit.textContent = `r/${subreddit}`;
                searchResults.innerHTML = '';
                searchInput.value = '';
                fetchSimilarSubreddits(subreddit);
            });
            searchResults.appendChild(div);
        });
    }

    // Add input event listener with debouncing
    searchInput.addEventListener('input', (e) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
            searchSubreddits(e.target.value.trim());
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.innerHTML = '';
        }
    });
});
