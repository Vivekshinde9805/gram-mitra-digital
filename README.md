# GramConnect Digital

Build a fully functional, mobile-responsive Gram Panchayat Digital Services Portal using React + TypeScript + Tailwind CSS + Supabase.



Main Features



- Modern, simple government-style dashboard for villagers.

- User signup/login/logout with Supabase Auth.

- User profile: Full Name, Village, Email, Mobile, Address, Profile Photo.

- Gram Panchayat information: village/area details, members, contact information.

- Online services: Water Connection, Electricity Connection, Property/House Tax, and other Panchayat services.

- Users can submit applications, upload documents, track application status, and view application history.

- Admin dashboard to manage users, applications, services, payments and Panchayat information.

- Payment/bill history with Paid/Pending status, amount and date.

- Search and filter applications.

- Generate/print simple PDF receipts/invoices.

- English + Marathi language toggle.



AI Features



Use my Gemini API key through a secure Supabase Edge Function:



1. AI Translator – translate website content, notices and application text between English and Marathi.

2. AI Chat/Writer Assistant – users can ask questions about Panchayat services and generate application/complaint/request letters. Keep answers simple and relevant to Gram Panchayat services.

3. Add loading states, error handling and API-key security. Never expose the Gemini API key in frontend code.



Supabase



Create the required database tables, relationships, Row Level Security policies and storage buckets for profiles/documents. Use Supabase Auth, Database and Storage properly.



UI



Create a clean, beginner-friendly, mobile-first interface with Dashboard, Services, Applications, Payments, Notifications, Profile, AI Assistant and Admin pages. Use cards, tables, forms, status badges and confirmation messages. Add proper validation and responsive navigation.



Important



Make the project actually functional, not a static UI. Connect every form and button to Supabase, create the required database schema automatically, handle authentication and permissions, include sample/demo Panchayat data, and provide clear setup instructions for environment variables and deployment.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gram-mitra-digital.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cf2b3a6b-512e-4c63-9c2f-0e9b16dd4a56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
