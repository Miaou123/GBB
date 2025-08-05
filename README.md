# Go Get Business - Job Aggregation Web App

A modern Next.js application that aggregates job offers from multiple French technology companies into a single, filterable interface.

## 🚀 Features

- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Job Aggregation**: Displays job offers from major French tech companies
- **Advanced Filtering**: Filter by company, location, or search terms
- **Responsive Design**: Mobile-first approach with clean, professional styling
- **Export Functionality**: Export filtered results to CSV
- **Real-time Search**: Debounced search with instant results
- **Sortable Columns**: Click column headers to sort data
- **Loading States**: Smooth loading indicators and error handling

## 🏢 Featured Companies

- Air France

## - In the work
- Infomil
- Estreem
- Berger Levrault
- Doxallia
- Lyra Network
- MFI

## 🛠️ Technical Implementation

### Project Structure

```
app/
├── components/
│   ├── JobTable.tsx          # Main table with sorting
│   ├── ClientFilter.tsx      # Company filter component
│   ├── LocationFilter.tsx    # Location filter component
│   └── RefreshButton.tsx     # Data refresh functionality
├── api/
│   └── jobs/route.ts         # API endpoint for job data
├── page.tsx                  # Main page component
├── layout.tsx                # Root layout
└── globals.css               # Tailwind styles

lib/
├── types.ts                  # TypeScript interfaces
├── utils.ts                  # Utility functions
└── mockData.ts              # Sample data for development
```

### Key Components

- **JobTable**: Sortable table with responsive design
- **Filters**: Collapsible filter panels with select all/none functionality
- **Search**: Real-time search across all job fields
- **Export**: CSV export with formatted data
- **API**: RESTful endpoint with query parameter support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📊 API Usage

### GET /api/jobs

Query parameters:
- `companies`: Comma-separated list of company names
- `locations`: Comma-separated list of locations  
- `search`: Search term for jobs

Example:
```
/api/jobs?companies=BPCE,Air%20France&locations=Paris&search=developer
```

Response:
```json
{
  "jobs": [...],
  "lastUpdated": "2024-01-28T10:30:00Z",
  "totalCount": 15
}
```

## 🎨 Styling

- **Primary Colors**: Blue theme (`primary-*` classes)
- **Components**: Pre-built utility classes in `globals.css`
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Animations**: Smooth transitions and loading states

## 🔧 Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Mock Data

The application includes sample data from 8 companies with realistic job titles and French locations. This can be easily replaced with real scraping data by updating the API route.

### Future Enhancements

- Real web scraping integration
- User authentication and saved searches
- Email notifications for new jobs
- Advanced filtering (salary, date range, job type)
- Company profiles and detailed job descriptions

## 📝 License

This project is for demonstration purposes. All company names and job data are mock data for development use only.