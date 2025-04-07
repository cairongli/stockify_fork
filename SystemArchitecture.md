# Stockify Architecture

## High-Level Component Diagram

![High-Level Component Diagram](/docs/component%20diagram.jpeg)

This diagram gives a simplified overview of the architecture of Stockify, the web application. Using Next.js, the web client communicates with Vercel, the hosting service for the frontend. Vercel serves these requests to Supabase, which offers various backend services, including user authentication, database queries, and file storage. Supabase interacts with a PostgreSQL database via SQL and also serves as a storage area where users can upload files to Supabase Storage. Furthermore, Supabase fetches real-time stock and news information by making HTTPS requests to external APIs. Each component is protected by HTTPS, and the overall serves modified servers with modern, scalable, and serverless architecture.

---

## Entity Relationship Diagram

![Entity Relationship Diagram](/docs/entity%20diagram.jpeg)

This entity diagram illustrates the database structure for Stockify. The profiles table contains information about the users and references to the default Supabase auth.users table. Every user is able to create posts, buy stocks through the userstock table, and add stocks to the wishlist. The stocks table is made up of stock details, which include name, ticker, and investor numbers. The userstock and wishlist tables serve as join tables that link the users with their owned and desired stocks. These relationships are crucial to the  structure of user activity and stock tracking within the app.

---

## Call Sequence Diagram

![Call Sequence Diagram](/docs/call%20sequence.jpeg)

This sequence diagram explains how a user places their trade on the platform. First, the user selects the explore page, and the web app retrieves user data stored in the Supabase database. If the user clicks on a stock card, a trade modal will be opened by the web app. Through the modal, the user specifies the trade details and sends the order, which is then executed by Supabase after the backend receives it. The backend also sends a response to the front end, which closes the modal, and the web app interface shows the new balance.

---
