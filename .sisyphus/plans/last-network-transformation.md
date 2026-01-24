# Last Network Transformation

## Context

### Original Request
Transform HypurrRelevancy (crypto news aggregator) into Last Network - a network connection portal where projects can apply to join, get screened by AI, reviewed by admins, and once approved, access the member network with directory, news, and eventually chat features.

### Key Decisions Made
- **Auth**: Twitter/Discord/Telegram OAuth for identity verification
- **News Feed**: Keep as secondary feature (tab within member area)
- **File Storage**: Vercel Blob for uploads (logos, proof of work)
- **MVP Scope**: Application flow + Basic member directory
- **Categories**: Lending, DEX, Derivatives, Infrastructure, Tooling, Analytics
- **Approvers**: Any admin can approve/reject
- **Visibility**: Members see profiles only, not application details
- **Branding**: LastNetwork on Vercel (lastnetwork.vercel.app)

---

## Work Objectives

### Core Objective
Build a gated network portal where projects apply, get AI-screened, human-reviewed, and upon approval gain access to a member directory and curated news feed.

### Concrete Deliverables
1. Public landing page explaining Last Network
2. Multi-step application form with file uploads
3. AI screening that scores applications and flags issues
4. Admin dashboard for reviewing applications
5. Member directory with search/filter
6. Member profile pages
7. Rebrand from HypurrRelevancy to Last Network

### Definition of Done
- [ ] Unauthenticated users can view landing page and submit applications
- [ ] AI automatically screens applications and generates summaries
- [ ] Admins can approve/reject/request-info on applications
- [ ] Approved projects become members and can access `/network`
- [ ] Members can browse directory and view other member profiles
- [ ] News feed accessible as secondary tab for members
- [ ] Deployed to lastnetwork.vercel.app

### Must Have
- OAuth authentication (Twitter or Discord minimum)
- Role-based access control (applicant/member/admin)
- AI screening with GPT-4o
- File uploads via Vercel Blob
- Member directory with filtering

### Must NOT Have (Guardrails)
- No crypto wallet connect in MVP (keep OAuth simple)
- No member-to-member chat in MVP (Phase 2)
- No public member directory (members only)
- No custom domains yet (Vercel subdomain for testing)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (existing test patterns)
- **User wants tests**: Manual verification for MVP
- **Framework**: Manual QA with browser testing

### Manual QA Procedures
Each task includes specific verification steps using browser navigation.

---

## Database Schema Changes

### New Models to Add

```prisma
enum UserRole {
  APPLICANT
  MEMBER  
  ADMIN
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED
  AI_SCREENING
  NEEDS_INFO
  UNDER_REVIEW
  APPROVED
  REJECTED
}

model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  name          String?
  image         String?
  
  // OAuth identifiers
  twitterId     String?  @unique
  twitterHandle String?
  discordId     String?  @unique
  discordHandle String?
  telegramId    String?  @unique
  telegramHandle String?
  
  role          UserRole @default(APPLICANT)
  
  // Relations
  applications  Application[]
  memberships   NetworkMember[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model NetworkMember {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Basic info
  name            String
  slug            String   @unique
  logo            String?
  website         String
  twitter         String?
  discord         String?
  github          String?
  description     String
  
  // Classification
  category        String   // lending, dex, derivatives, infrastructure, tooling, analytics
  stage           String   // live, testnet, building
  
  // Network participation
  seeking         String[] // listing, lp_intros, distribution, other
  offering        String[] // liquidity, integration, other
  
  // From application
  applicationId   String?  @unique
  application     Application? @relation(fields: [applicationId], references: [id])
  
  joinedAt        DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category])
  @@index([stage])
}

model Application {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Project info
  projectName     String
  website         String
  twitter         String?
  discord         String?
  github          String?
  contactEmail    String
  
  // Details
  description     String
  teamInfo        String
  stage           String   // live, testnet, building
  category        String
  
  // What they seek
  seekingListing      Boolean @default(false)
  seekingLPIntros     Boolean @default(false)
  seekingDistribution Boolean @default(false)
  seekingOther        String?
  
  // What they offer
  offeringLiquidity   Boolean @default(false)
  offeringIntegration Boolean @default(false)
  offeringOther       String?
  
  // Proof of work
  proofOfWork     String?
  logoUrl         String?
  attachmentUrls  String[]
  
  // AI Screening
  aiScore         Int?
  aiSummary       String?
  aiFlags         String[]
  aiScreenedAt    DateTime?
  
  // Review
  status          ApplicationStatus @default(DRAFT)
  reviewerNotes   String?
  reviewedBy      String?
  reviewedAt      DateTime?
  
  // If approved
  member          NetworkMember?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status])
  @@index([userId])
}
```

---

## TODOs

### Phase 1: Foundation

- [ ] 1. Set up NextAuth with OAuth providers

  **What to do**:
  - Install next-auth and provider packages
  - Create `/app/api/auth/[...nextauth]/route.ts`
  - Configure Twitter OAuth provider
  - Configure Discord OAuth provider
  - Add User model to Prisma schema
  - Create session provider wrapper

  **References**:
  - `src/app/api/` - Existing API route patterns
  - `prisma/schema.prisma` - Add User model here
  - NextAuth.js docs for App Router setup

  **Acceptance Criteria**:
  - [ ] User can click "Sign in with Twitter" and authenticate
  - [ ] User can click "Sign in with Discord" and authenticate
  - [ ] User record created in database on first sign-in
  - [ ] Session persists across page refreshes

  **Parallelizable**: NO (blocks all auth-dependent tasks)
  **Commit**: YES - `feat(auth): add NextAuth with Twitter/Discord OAuth`

---

- [ ] 2. Add Application and NetworkMember models

  **What to do**:
  - Add enums (UserRole, ApplicationStatus) to schema
  - Add NetworkMember model
  - Add Application model
  - Run `prisma db push` to sync
  - Generate Prisma client

  **References**:
  - `prisma/schema.prisma` - Existing models for pattern
  - Schema design in this plan

  **Acceptance Criteria**:
  - [ ] `npx prisma db push` succeeds
  - [ ] Can create Application record via Prisma Studio
  - [ ] Can create NetworkMember record via Prisma Studio

  **Parallelizable**: YES (with task 1)
  **Commit**: YES - `feat(db): add Application and NetworkMember models`

---

- [ ] 3. Set up Vercel Blob for file uploads

  **What to do**:
  - Install `@vercel/blob` package
  - Create upload API route `/api/upload`
  - Create reusable FileUpload component
  - Handle logo uploads (image validation)
  - Handle document uploads (PDF, images)

  **References**:
  - Vercel Blob documentation
  - `src/components/` - Component patterns

  **Acceptance Criteria**:
  - [ ] Can upload image file and receive URL
  - [ ] Can upload PDF and receive URL
  - [ ] Invalid file types rejected with error message
  - [ ] Upload progress indicator works

  **Parallelizable**: YES (with tasks 1, 2)
  **Commit**: YES - `feat(upload): add Vercel Blob file upload`

---

- [ ] 4. Create role-based middleware

  **What to do**:
  - Create `src/lib/auth.ts` with role check utilities
  - Create middleware for protected routes
  - Implement `requireRole(role)` helper
  - Add role to session type

  **References**:
  - `src/app/api/` - Existing route patterns
  - NextAuth session callback documentation

  **Acceptance Criteria**:
  - [ ] APPLICANT cannot access `/network`
  - [ ] MEMBER can access `/network`
  - [ ] Non-ADMIN cannot access `/admin`
  - [ ] ADMIN can access `/admin`
  - [ ] Unauthorized redirects to appropriate page

  **Parallelizable**: NO (depends on task 1)
  **Commit**: YES - `feat(auth): add role-based route protection`

---

### Phase 2: Application Flow

- [ ] 5. Create landing page

  **What to do**:
  - Replace current `src/app/page.tsx` with landing page
  - Hero section: "Last Network" branding + value prop
  - What is Last Network section
  - How it works (Apply → Screen → Review → Join)
  - CTA buttons: "Apply to Join" + "Sign In"
  - Footer with links

  **References**:
  - `src/app/page.tsx` - Current structure (will replace)
  - Current dark theme colors (#0a0a0a, #50e2c3)

  **Acceptance Criteria**:
  - [ ] Landing page loads at `/`
  - [ ] "Apply to Join" links to `/apply`
  - [ ] "Sign In" triggers OAuth flow
  - [ ] Mobile responsive
  - [ ] Matches Last Network branding

  **Parallelizable**: YES (with tasks 2, 3)
  **Commit**: YES - `feat(ui): create Last Network landing page`

---

- [ ] 6. Create multi-step application form

  **What to do**:
  - Create `/app/apply/page.tsx`
  - Step 1: Project basics (name, website, links)
  - Step 2: Team & stage info
  - Step 3: What you're seeking (checkboxes)
  - Step 4: What you offer (checkboxes)
  - Step 5: Proof of work (text + file uploads)
  - Step 6: Review & submit
  - Form state management with React Hook Form
  - Zod validation
  - Auto-save draft to localStorage

  **References**:
  - `src/components/Watchlist.tsx` - Form patterns
  - `src/components/ArticleSummary.tsx` - Modal/drawer patterns

  **Acceptance Criteria**:
  - [ ] User must be signed in to access `/apply`
  - [ ] Can progress through all 6 steps
  - [ ] Can go back to previous steps
  - [ ] Form validates required fields
  - [ ] File upload works for logo and attachments
  - [ ] Draft auto-saves and restores
  - [ ] Submit creates Application record with status=SUBMITTED

  **Parallelizable**: NO (depends on tasks 1, 3, 4)
  **Commit**: YES - `feat(apply): create multi-step application form`

---

- [ ] 7. Create AI screening service

  **What to do**:
  - Create `src/services/application-screening.ts`
  - Repurpose pattern from `src/services/relevancy.ts`
  - Score application 0-100 based on:
    - Completeness of information
    - Quality of proof of work
    - Team credibility signals
    - Fit with network goals
  - Generate summary for human reviewer
  - Flag gaps or red flags
  - Return Pass / Fail / Needs Info recommendation

  **References**:
  - `src/services/relevancy.ts` - GPT scoring pattern
  - `src/services/chat.ts` - OpenAI integration

  **Acceptance Criteria**:
  - [ ] Takes Application ID, returns score + summary + flags
  - [ ] Scores are consistent (similar apps get similar scores)
  - [ ] Summary is helpful for human reviewer
  - [ ] Flags obvious issues (missing website, no proof of work)
  - [ ] Updates Application record with AI results

  **Parallelizable**: YES (with task 6)
  **Commit**: YES - `feat(screening): add AI application screening`

---

- [ ] 8. Create application submission API

  **What to do**:
  - Create `/api/applications/route.ts` (POST to submit)
  - Create `/api/applications/[id]/route.ts` (GET status)
  - On submit: validate, save, trigger AI screening
  - Return application ID for status tracking

  **References**:
  - `src/app/api/tiles/route.ts` - API patterns
  - `src/app/api/chat/route.ts` - POST handling

  **Acceptance Criteria**:
  - [ ] POST creates application with status=SUBMITTED
  - [ ] AI screening runs automatically after submit
  - [ ] GET returns application status and AI summary (if screened)
  - [ ] Unauthorized users get 401

  **Parallelizable**: NO (depends on tasks 6, 7)
  **Commit**: YES - `feat(api): add application submission endpoints`

---

- [ ] 9. Create application status page

  **What to do**:
  - Create `/app/status/page.tsx`
  - Show current application status
  - Show AI score (if screened)
  - Show reviewer feedback (if any)
  - Allow resubmission if NEEDS_INFO

  **References**:
  - `src/app/page.tsx` - Page structure patterns

  **Acceptance Criteria**:
  - [ ] Shows "Submitted" status after submit
  - [ ] Shows "Under Review" when AI screening complete
  - [ ] Shows feedback if NEEDS_INFO
  - [ ] Shows "Approved! Access network" with link if approved
  - [ ] Shows "Rejected" with reason if rejected

  **Parallelizable**: YES (with task 8)
  **Commit**: YES - `feat(ui): create application status page`

---

### Phase 3: Admin Review

- [ ] 10. Create admin applications dashboard

  **What to do**:
  - Create `/app/admin/page.tsx`
  - List all applications (sortable by date, status, AI score)
  - Filter by status (SUBMITTED, AI_SCREENING, UNDER_REVIEW, etc.)
  - Click to view application detail
  - Show counts per status

  **References**:
  - `src/app/page.tsx` - Dashboard layout patterns
  - `src/services/tiles.ts` - Data fetching patterns

  **Acceptance Criteria**:
  - [ ] Only ADMIN role can access
  - [ ] Shows all applications in table/list
  - [ ] Can filter by status
  - [ ] Can sort by date or AI score
  - [ ] Click opens application detail

  **Parallelizable**: NO (depends on Phase 2)
  **Commit**: YES - `feat(admin): create applications review dashboard`

---

- [ ] 11. Create application review detail view

  **What to do**:
  - Create `/app/admin/applications/[id]/page.tsx`
  - Show full application details
  - Show AI summary and flags prominently
  - Show AI score with explanation
  - Show uploaded files (viewable/downloadable)
  - Action buttons: Approve / Reject / Request Info

  **References**:
  - `src/components/ArticleSummary.tsx` - Detail view patterns
  - `src/components/ItemDrawer.tsx` - Drawer patterns

  **Acceptance Criteria**:
  - [ ] Shows all application fields
  - [ ] AI summary visible at top
  - [ ] AI flags highlighted (if any)
  - [ ] Can view uploaded logo/attachments
  - [ ] Approve button works
  - [ ] Reject button requires reason
  - [ ] Request Info button requires message

  **Parallelizable**: YES (with task 10)
  **Commit**: YES - `feat(admin): create application review detail view`

---

- [ ] 12. Implement approve/reject/request-info actions

  **What to do**:
  - Create `/api/admin/applications/[id]/review/route.ts`
  - POST with action: approve | reject | request_info
  - On approve: create NetworkMember, update status, send welcome email
  - On reject: update status, send rejection email
  - On request_info: update status, send email with message

  **References**:
  - `src/app/api/tiles/route.ts` - API patterns
  - Application → NetworkMember conversion logic

  **Acceptance Criteria**:
  - [ ] Approve creates NetworkMember with slug
  - [ ] Approve sets Application status to APPROVED
  - [ ] Approve links Application to NetworkMember
  - [ ] Reject sets status to REJECTED with reason
  - [ ] Request Info sets status to NEEDS_INFO
  - [ ] All actions record reviewedBy and reviewedAt

  **Parallelizable**: NO (depends on task 11)
  **Commit**: YES - `feat(admin): implement application review actions`

---

### Phase 4: Member Directory

- [ ] 13. Create member network dashboard

  **What to do**:
  - Create `/app/network/page.tsx`
  - Primary: Member directory (grid of member cards)
  - Secondary: News tab (reuse existing news components)
  - Header with search and filters
  - Filter by category, stage, seeking, offering

  **References**:
  - `src/app/page.tsx` - Current dashboard structure
  - Reuse: `StoryCard`, `HeroStoryCard`, `LatestItem` for news tab

  **Acceptance Criteria**:
  - [ ] Only MEMBER or ADMIN can access
  - [ ] Directory tab is default/primary
  - [ ] Shows grid of member cards
  - [ ] Can search by name
  - [ ] Can filter by category
  - [ ] News tab shows existing news feed
  - [ ] Mobile responsive

  **Parallelizable**: NO (depends on Phase 3)
  **Commit**: YES - `feat(network): create member dashboard with directory`

---

- [ ] 14. Create member card component

  **What to do**:
  - Create `src/components/MemberCard.tsx`
  - Show: logo, name, category badge, stage badge
  - Show: short description (truncated)
  - Show: seeking tags (what they want)
  - Show: offering tags (what they provide)
  - Click to view full profile

  **References**:
  - `src/app/page.tsx` - StoryCard component pattern
  - Current card styling (dark theme, hover effects)

  **Acceptance Criteria**:
  - [ ] Renders member data correctly
  - [ ] Logo displays (or placeholder if none)
  - [ ] Category and stage badges visible
  - [ ] Seeking/offering tags visible
  - [ ] Hover effect on card
  - [ ] Click navigates to `/network/[slug]`

  **Parallelizable**: YES (with task 13)
  **Commit**: YES - `feat(ui): create MemberCard component`

---

- [ ] 15. Create member profile page

  **What to do**:
  - Create `/app/network/[slug]/page.tsx`
  - Full member details
  - Large logo, name, links (website, Twitter, Discord, GitHub)
  - Full description
  - What they're seeking
  - What they offer
  - Stage and category
  - Joined date
  - Back to directory link

  **References**:
  - `src/components/ArticleSummary.tsx` - Detail view patterns

  **Acceptance Criteria**:
  - [ ] Loads member by slug
  - [ ] Shows all member information
  - [ ] Links open in new tabs
  - [ ] 404 if slug not found
  - [ ] Back link works
  - [ ] Mobile responsive

  **Parallelizable**: YES (with task 14)
  **Commit**: YES - `feat(network): create member profile page`

---

### Phase 5: Branding & Polish

- [ ] 16. Rebrand to Last Network

  **What to do**:
  - Update site title and meta tags
  - Replace HypurrRelevancy branding with Last Network
  - Update logo/favicon
  - Adjust color scheme if needed (keep dark theme)
  - Update header component

  **References**:
  - `src/app/layout.tsx` - Meta tags
  - `src/app/page.tsx` - Header component
  - `public/` - Static assets

  **Acceptance Criteria**:
  - [ ] Browser tab shows "Last Network"
  - [ ] Header shows Last Network branding
  - [ ] No HypurrRelevancy references remain
  - [ ] Favicon updated

  **Parallelizable**: YES (with Phase 4)
  **Commit**: YES - `feat(brand): rebrand to Last Network`

---

- [ ] 17. Deploy to lastnetwork.vercel.app

  **What to do**:
  - Create new Vercel project or rename existing
  - Set up environment variables
  - Configure OAuth callback URLs
  - Deploy and verify
  - Set up alias to lastnetwork.vercel.app

  **Acceptance Criteria**:
  - [ ] Site accessible at lastnetwork.vercel.app
  - [ ] OAuth login works in production
  - [ ] Database connected and working
  - [ ] File uploads work
  - [ ] Full flow works: apply → screen → review → approve → access

  **Parallelizable**: NO (final task)
  **Commit**: YES - `chore: deploy to lastnetwork.vercel.app`

---

## Commit Strategy

| After Task | Message | Key Files |
|------------|---------|-----------|
| 1 | `feat(auth): add NextAuth with Twitter/Discord OAuth` | api/auth, lib/auth, schema |
| 2 | `feat(db): add Application and NetworkMember models` | schema.prisma |
| 3 | `feat(upload): add Vercel Blob file upload` | api/upload, components/FileUpload |
| 4 | `feat(auth): add role-based route protection` | lib/auth, middleware |
| 5 | `feat(ui): create Last Network landing page` | app/page.tsx |
| 6 | `feat(apply): create multi-step application form` | app/apply |
| 7 | `feat(screening): add AI application screening` | services/application-screening |
| 8 | `feat(api): add application submission endpoints` | api/applications |
| 9 | `feat(ui): create application status page` | app/status |
| 10 | `feat(admin): create applications review dashboard` | app/admin |
| 11 | `feat(admin): create application review detail view` | app/admin/applications |
| 12 | `feat(admin): implement application review actions` | api/admin |
| 13 | `feat(network): create member dashboard with directory` | app/network |
| 14 | `feat(ui): create MemberCard component` | components/MemberCard |
| 15 | `feat(network): create member profile page` | app/network/[slug] |
| 16 | `feat(brand): rebrand to Last Network` | layout, page, public |
| 17 | `chore: deploy to lastnetwork.vercel.app` | - |

---

## Success Criteria

### Final Verification
```bash
# Full flow test:
1. Visit lastnetwork.vercel.app - see landing page
2. Click "Apply to Join" - redirects to sign in
3. Sign in with Twitter - creates user
4. Fill out application form - all steps work
5. Submit - application created, AI screening runs
6. Check /status - shows "Under Review"
7. Sign in as admin - can see application in /admin
8. Review application - see AI summary and details
9. Approve - NetworkMember created
10. Sign back in as applicant - now has MEMBER role
11. Access /network - see directory
12. Click member card - see profile
13. Click News tab - see news feed
```

### Final Checklist
- [ ] Public landing page works
- [ ] OAuth authentication works (Twitter + Discord)
- [ ] Application form submits successfully
- [ ] AI screening generates scores and summaries
- [ ] Admin can review and approve/reject
- [ ] Approved users gain MEMBER role
- [ ] Members can access directory
- [ ] News feed works for members
- [ ] Mobile responsive
- [ ] Deployed to lastnetwork.vercel.app
