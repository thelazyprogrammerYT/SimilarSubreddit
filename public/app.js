// Client-side JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const selectedSubreddit = document.getElementById('selectedSubreddit');
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
                selectedSubreddit.textContent = subreddit;
                searchResults.innerHTML = '';
                searchInput.value = '';
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
