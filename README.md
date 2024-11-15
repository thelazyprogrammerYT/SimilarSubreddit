# Subreddit Explorer - Project Plan

**Subreddit Explorer** is a simple web application built with **ExpressJS** that allows users to search for and explore subreddits. It fetches data directly from Reddit's API and displays related subreddits based on search criteria.

---

## Features

1. **Search Subreddits**
   - Users can search for subreddits by name.
   - Display a list of matching subreddits with a brief description.
   - **Autofill Search**: Subreddits are suggested as the user types, showing relevant results in real time.

2. **Related Subreddits**  
   - When a user selects a subreddit, display a list of related subreddits based on **relatedness** or **popularity**.

---

## Technical Specifications

- **Backend**: ExpressJS to handle routing and API requests.
- **Data Source**: Direct calls to the **Reddit API** (no third-party libraries).
- **Frontend**: Basic HTML/CSS and JavaScript for rendering search results and related subreddits.
- **Hosting**: The app will be hosted **locally** for testing purposes.

---

## Roadmap

### Phase 1: Initial Setup

1. **Set Up ExpressJS App**  
   - Initialize an **ExpressJS** app locally.
   - Install necessary dependencies (e.g., `express`, `axios` for making API requests).

2. **Search Subreddits**  
   - Implement a search bar to fetch subreddits based on the user's input.
   - Use **Reddit's API** to search for subreddits and display a list of matching subreddits with their descriptions.
   - Implement **autofill search** to suggest subreddits as the user types.

### Phase 2: Related Subreddits

1. **Display Related Subreddits**  
   - When a user selects a subreddit, fetch and display a list of **related subreddits** based on either **relatedness** (Reddit's own suggestions) or **popularity**.
   - Show a brief description and number of subscribers for each related subreddit.
