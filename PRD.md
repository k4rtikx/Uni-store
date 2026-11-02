ReuseCampus
Product Requirements Document (PRD)
Version 2.0  |  Development Ready  |  Web Application
Product	ReuseCampus
Parent Ecosystem	Campus 360
Primary Users	College Students
Initial Scope	Single-college pilot
1. Product Overview
ReuseCampus is a campus-specific second-hand marketplace designed exclusively for college students. The platform allows verified students from the same college to sell used items, buy affordable items, discover reusable products, contact sellers directly, manage their own listings, and mark items as sold. The initial MVP will focus on a single-college pilot.
2. Problem Statement
College students frequently purchase textbooks, lab equipment, stationery, electronics, bags, clothing and other items that remain useful after one semester or academic year. Students commonly rely on WhatsApp groups, personal contacts, physical notice boards and general marketplaces. These approaches make listings difficult to discover, messages easy to miss, and transactions less campus-specific.
ReuseCampus provides a trusted, searchable and campus-specific platform for buying, selling and reusing items within a college community.
3. Product Goals
3.1 Primary Goals
1.	Build a functional marketplace MVP.
2.	Restrict the initial marketplace to one college.
3.	Allow students to create and manage listings.
4.	Allow students to discover, search and filter available items.
5.	Enable direct seller contact.
6.	Provide a simple and trustworthy campus marketplace experience.
7.	Use production-oriented development practices suitable for a portfolio and placement discussions.
3.2 Initial Success Metrics
•	50+ registered students
•	30+ active listings
•	20+ successful transactions
•	Less than 24-hour average seller response time
•	40%+ weekly returning users
4. Target Users
4.1 Student Buyer
A student looking for affordable used products. Primary goals: find relevant products quickly, compare prices, check condition, and contact the seller.
4.2 Student Seller
A student who wants to sell unused items. Primary goals: create a listing easily, reach students within campus, manage active listings, and mark an item as sold.
4.3 Administrator
A campus/platform administrator responsible for monitoring users and listings and maintaining marketplace quality. Advanced admin functionality is outside the initial MVP.
5. Product Principles
•	Trust — only users belonging to the target college should participate.
•	Simplicity — posting and finding an item should require minimal effort.
•	Locality — transactions focus on the same campus.
•	Speed — users should quickly find an item and contact the seller.
•	Safety — authentication credentials and user data must be handled securely.
•	Scalability — the architecture should allow future multi-college expansion.
6. MVP Scope
8.	Authentication
9.	Marketplace/Home
10.	Listing Management
11.	Item Details
12.	Search
13.	Filtering
14.	Seller Contact
15.	My Listings
16.	Profile
17.	Basic moderation-ready architecture
7. Functional Requirements
7.1 Authentication
Registration fields: name, college email, password, confirm password, and contact number. Email must be unique. Passwords must be securely hashed. Required fields and invalid input must be validated. Authentication should use JWT-based sessions.
Login uses college email and password. Users must be able to log out securely.
8. College Verification
The MVP targets a single college. Registration should verify the approved college email domain. The allowed domain must be configurable through environment variables rather than hardcoded throughout the application.
9. Marketplace / Home
•	Search bar
•	Category filters
•	Price filter
•	Condition filter
•	Listing cards
•	Listing status
•	Loading state
•	Empty state
•	Error state
Each listing card displays item image, item name, price, category, condition, seller name, and availability status.
10. Categories
•	Books
•	Lab Equipment
•	Electronics
•	Stationery
•	Clothing
•	Bags & Accessories
•	Furniture
•	Other
11. Create Listing
•	Item title
•	Category
•	Price
•	Condition
•	Description
•	Item image
Condition options: New, Like New, Good, Fair.
Only authenticated users can create listings. Title, price, category, condition and description must be validated. Seller identity is automatically associated with the listing.
12. Image Management
Images should be stored using an external image-storage service. The database stores the resulting image URL/reference rather than binary image data.
•	Validate image type
•	Limit image size
•	Handle upload failures gracefully
•	Store only valid image references
•	Provide fallback UI for failed image loading
13. Item Detail Page
•	Item image
•	Item title
•	Price
•	Category
•	Condition
•	Description
•	Seller name
•	Listing date
•	Availability status
Primary action: Contact Seller. If a listing is sold, the UI should clearly display SOLD and should not encourage a new transaction.
14. Contact Seller
The MVP uses external communication rather than building a complete chat system. WhatsApp is the primary contact method.
Out of scope: real-time chat, message storage, read receipts, typing indicators, and notifications.
15. Search
Users can search listings using keywords. Search should primarily consider item title, description, and relevant searchable fields.
16. Filtering
•	Category
•	Minimum/maximum price
•	Condition
Filters should be combinable.
17. Listing Status
Listings use a simple lifecycle: AVAILABLE → SOLD. Only the listing owner can mark their listing as sold.
18. My Listings
Authenticated users have a dashboard showing their own listings.
•	View
•	Edit
•	Delete
•	Mark as Sold
A user must not be able to modify or delete another user's listing.
19. Edit Listing
•	Title
•	Category
•	Price
•	Condition
•	Description
•	Image
Editing follows the same validation rules as creating a listing.
20. Delete Listing
Owners can delete their own listings. The UI should provide an appropriate confirmation mechanism before deletion. Unauthorized deletion requests must be rejected by the backend.
21. Profile
•	Name
•	College
•	Contact information
•	Account information
•	Number of listings
Users may manage basic profile information where implemented.
22. Authorization Rules
22.1 Public
•	View marketplace listings
•	Search listings
•	Filter listings
•	View item details
22.2 Authenticated
•	Create listing
•	Edit own listing
•	Delete own listing
•	Mark own listing as sold
•	Manage profile
22.3 Ownership
Resource ownership must be checked on the backend. A user may modify only resources they own.
23. Data Model
23.1 User
Expected fields: _id, name, email, passwordHash, college, phone, avatar, createdAt, updatedAt.
23.2 Listing
Expected fields: _id, title, description, price, category, condition, imageUrl, seller, status, createdAt, updatedAt. The seller field references the corresponding User.
24. API Requirements
24.1 Authentication
•	POST /api/auth/register
•	POST /api/auth/login
24.2 Listings
•	GET /api/listings
•	GET /api/listings/:id
•	POST /api/listings
•	PUT /api/listings/:id
•	DELETE /api/listings/:id
•	PATCH /api/listings/:id/sold
24.3 Profile
•	GET /api/users/me
•	PUT /api/users/me
The exact API structure can be refined during implementation.
25. API Response Principles
Success responses should follow a predictable structure such as: { success: true, data: {} }.
Error responses should follow a predictable structure such as: { success: false, message: "Something went wrong" }. Sensitive internal errors must not be exposed.
26. Frontend Requirements
•	Responsive
•	Component-based
•	Accessible
•	Reusable
•	Consistent
•	Mobile-friendly
Every data-dependent page should account for Loading, Success, Empty, and Error states.
27. Security Requirements
•	Hash passwords
•	Never store plaintext passwords
•	Protect private API routes
•	Validate incoming data
•	Validate resource ownership
•	Keep secrets in environment variables
•	Restrict image uploads
•	Handle authentication errors safely
•	Avoid exposing sensitive database information
•	Configure CORS appropriately for production
28. Non-Functional Requirements
28.1 Performance
•	Fast marketplace loading
•	Reasonably fast API responses
•	Optimized images where possible
28.2 Reliability
•	Graceful backend error handling
•	Frontend should not crash on failed requests
28.3 Scalability
The initial system targets one college but should allow future support for multiple colleges.
28.4 Maintainability
•	Reusable components
•	Modular backend structure
•	Clear naming
•	Separation of concerns
•	Environment-based configuration
29. Application Pages
•	Home / Marketplace
•	Login
•	Register
•	Post Item
•	Item Details
•	My Listings
•	Edit Listing
•	Profile
Future pages may include Admin Dashboard, Notifications, Messages, Favorites, and College Management.
30. MVP User Flows
30.1 Seller Flow
Register → Login → Home → Post Item → Enter Details → Upload Image → Create Listing → Marketplace → Buyer Contacts Seller → Deal Completed → Seller Marks Item as Sold
30.2 Buyer Flow
Home → Search / Filter → Select Item → View Details → Check Price + Condition + Seller → Contact Seller → Deal Completed
31. Error & Edge Cases
•	Duplicate email registration
•	Invalid login credentials
•	Unauthorized API requests
•	Expired/invalid JWT
•	Invalid listing ID
•	Deleted listing
•	Sold listing
•	Empty search results
•	Invalid category
•	Invalid price
•	Missing required fields
•	Invalid image
•	Oversized image
•	Failed image upload
•	Database connection failure
•	Network/API failure
32. Out of Scope — MVP
•	In-app payments
•	Real-time chat
•	Mobile application
•	Multiple-college marketplace
•	AI recommendations
•	Video uploads
•	Complex notification system
•	Rating/review system
•	Escrow
•	Delivery system
•	Advanced admin analytics
•	Recommendation engine
33. Future Roadmap
Phase 2
•	Favorites/Wishlist
•	Notifications
•	Better seller profiles
•	Ratings and reviews
•	Advanced search
Phase 3
•	Real-time messaging
•	AI-powered recommendations
•	AI listing assistance
•	Smart price suggestions
Phase 4
•	Multiple colleges
•	College-specific instances
•	Admin dashboards
•	Analytics
Phase 5
Integrate ReuseCampus into the wider Campus 360 ecosystem, including SkillXchange, FindIt, RecycLOOP and other campus modules.
34. Development Strategy
Development should follow dependency order rather than random feature implementation.
18.	Project Foundation
19.	UI/UX Foundation
20.	Database Design
21.	Backend Foundation
22.	Authentication
23.	Listing APIs
24.	Frontend API Integration
25.	Image Upload
26.	Search + Filters
27.	My Listings
28.	Profile
29.	Security + Validation
30.	Testing
31.	Deployment
35. Definition of Done
•	Student registration works
•	Student login works
•	Authentication is protected
•	Students can create listings
•	Images can be uploaded
•	Listings appear in marketplace
•	Search works
•	Filters work
•	Item details work
•	Seller contact works
•	Owners can edit/delete listings
•	Owners can mark listings as sold
•	Users can view their own listings
•	Profile functionality works
•	Unauthorized operations are blocked
•	Major errors are handled
•	Application is responsive
•	Application is deployed
•	GitHub repository contains professional documentation
36. Portfolio / Placement Objective
ReuseCampus should demonstrate practical understanding of React development, component architecture, REST API development, Node.js + Express, MongoDB, authentication, JWT authorization, CRUD operations, image upload, API integration, search/filtering, error handling, security fundamentals, Git/GitHub and deployment.
The project should be explainable in an interview from UI → API → database → authentication → deployment.
37. Final Product Vision
ReuseCampus is not intended to be just a CRUD project. The MVP should demonstrate a complete real-world product lifecycle: Problem → Product → User → UI → Backend → Database → Authentication → Real-world transaction flow → Deployment → User feedback → Iteration.
The initial goal is to build a simple, reliable and placement-ready campus marketplace while keeping the architecture ready for future expansion into the Campus 360 ecosystem.
