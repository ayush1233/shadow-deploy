from fpdf import FPDF

class ThesisPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(128, 128, 128)
            self.cell(0, 8, "Shadow-Deploy: AI-Powered API Validation Platform", align="C")
            self.ln(4)
            self.set_draw_color(200, 200, 200)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(20, 60, 120)
        self.cell(0, 9, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(20, 60, 120)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(40, 40, 40)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def bold_inline(self, bold_part, normal_part):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.write(5.5, bold_part)
        self.set_font("Helvetica", "", 10)
        self.write(5.5, normal_part)
        self.ln(6)

    def bullet(self, text, indent=15):
        x = self.get_x()
        self.set_x(indent)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.cell(5, 5.5, "-")
        self.multi_cell(0 - indent - 5 + 10, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def table_row(self, cells, bold=False, header=False):
        style = "B" if bold or header else ""
        if header:
            self.set_fill_color(20, 60, 120)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(245, 245, 250)
            self.set_text_color(30, 30, 30)
        self.set_font("Helvetica", style, 9)
        col_widths = [40, 25, 125]
        for i, cell in enumerate(cells):
            w = col_widths[i] if i < len(col_widths) else 60
            self.cell(w, 7, cell, border=1, fill=True)
        self.ln()


pdf = ThesisPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Title
pdf.set_font("Helvetica", "B", 20)
pdf.set_text_color(20, 60, 120)
pdf.cell(0, 14, "Shadow-Deploy", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 13)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 9, "AI-Powered API Validation Platform", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)
pdf.set_draw_color(20, 60, 120)
pdf.set_line_width(0.8)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(6)
pdf.set_font("Helvetica", "I", 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 7, "Detailed Project Overview for Thesis", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)

# 1. Introduction
pdf.section_title("1. Introduction and Problem Statement")
pdf.body_text(
    "Deploying API changes in production environments is inherently risky. Traditional deployment strategies rely on "
    "synthetic test suites and staging environments that fail to replicate real-world traffic patterns, edge cases, and "
    "scale. Bugs such as race conditions, null field handling errors, and breaking schema changes often surface only after "
    "deployment - when thousands of users are already impacted. Rollbacks, while possible, are reactive and come after "
    "damage is done."
)
pdf.body_text(
    "Shadow-Deploy addresses this fundamental challenge by introducing a real-time traffic mirroring and AI-powered "
    "comparison platform that validates new API versions against production traffic before promotion - with zero impact on "
    "end users. The shadow (candidate) API receives mirrored copies of live requests, its responses are captured and compared "
    "against the production API's responses, and an AI-driven risk assessment determines whether the deployment is safe to "
    "promote. The user never receives the shadow response; they always interact with the stable production version."
)

# 2. Architecture
pdf.section_title("2. System Architecture")
pdf.body_text(
    "Shadow-Deploy follows a microservices architecture composed of four core backend services, a React-based dashboard, "
    "and supporting infrastructure components."
)

pdf.bold_inline("Ingestion Service (Java 17, Spring Boot) - ",
    "Accepts traffic events from three configurable modes: (1) NGINX reverse proxy mirroring at the network layer with "
    "zero code changes, (2) Kong API Gateway plugin for Kong users, and (3) Java/Node.js SDKs for microservice "
    "architectures. Captured production and shadow responses are published to Apache Kafka topics (prod-traffic and "
    "shadow-traffic) for asynchronous, decoupled processing.")

pdf.bold_inline("Comparison Engine (Java 17, Spring Boot) - ",
    "Consumes from both Kafka topics and uses Redis as a correlation cache, joining production and shadow responses by "
    "request_id. It performs deterministic comparison across four dimensions: HTTP status codes, response headers, JSON "
    "deep diff (field-level using zjsonpatch detecting ADDED, REMOVED, and CHANGED fields), and response latency delta. "
    "An intelligent noise detection system auto-tracks which JSON paths (e.g., updated_at, request_id) differ in more than "
    "80% of comparisons and flags them as noise - preventing false positives while maintaining transparency.")

pdf.bold_inline("AI Service (Python, FastAPI) - ",
    "The intelligence layer that distinguishes meaningful changes from benign differences. Integrates with Google Gemini "
    "as the primary LLM provider, with Ollama (local LLM) and heuristic-based analysis as fallbacks, ensuring no vendor "
    "lock-in. A PII masking module redacts emails, SSNs, credit card numbers, and API keys before any data is sent to "
    "the LLM. The AI analyzes whether differences are semantically breaking (e.g., status 'active' changed to 'pending') "
    "or safe (e.g., a new cache_ttl field was added). Additionally includes an NGINX configurator that accepts natural "
    "language instructions and generates valid NGINX configuration files.")

pdf.bold_inline("API Service (Java 17, Spring Boot) - ",
    "Serves as the data access layer for the dashboard, exposing RESTful endpoints for paginated comparison queries, "
    "aggregated metrics, trend data, and deployment reports. Secured via JWT authentication with role-based access control "
    "(admin, editor, viewer).")

pdf.body_text(
    "Infrastructure: NGINX handles traffic mirroring using split_clients for deterministic, stateless sampling by request "
    "ID. Kafka provides buffered, partitioned message delivery (6 partitions by default). Redis serves dual purposes: "
    "request correlation (stream join) and noise field tracking with TTL-based expiration. PostgreSQL (hosted on Supabase) "
    "stores all comparison results with Row-Level Security (RLS) enforcing strict tenant isolation. Prometheus and Grafana "
    "provide full observability. The entire stack is containerized with Docker Compose (10+ services)."
)

# 3. Technology Stack
pdf.section_title("3. Technology Stack")

pdf.table_row(["Component", "Layer", "Technology"], header=True)
pdf.table_row(["Frontend", "UI", "React 18, TypeScript, Vite, Recharts, Framer Motion"])
pdf.table_row(["Authentication", "Auth", "Supabase Auth, JWT, RBAC (admin/editor/viewer)"])
pdf.table_row(["Backend Services", "API", "Spring Boot (Java 17) - 3 microservices"])
pdf.table_row(["AI/ML Service", "AI", "Python FastAPI, Google Gemini, Ollama fallback"])
pdf.table_row(["Message Broker", "Infra", "Apache Kafka (4 topics, 6 partitions)"])
pdf.table_row(["Cache", "Infra", "Redis (correlation + noise detection)"])
pdf.table_row(["Reverse Proxy", "Infra", "NGINX (traffic mirroring, SSL termination)"])
pdf.table_row(["Database", "Storage", "PostgreSQL (Supabase), RLS-enabled, multi-tenant"])
pdf.table_row(["Monitoring", "Ops", "Prometheus + Grafana custom dashboards"])
pdf.table_row(["Deployment", "DevOps", "Docker Compose, GitHub Actions CI/CD"])
pdf.ln(3)

# 4. Risk Scoring
pdf.section_title("4. Risk Scoring Algorithm")
pdf.body_text(
    "The platform computes a composite risk score (0-10) using a weighted multi-factor formula that combines both "
    "deterministic and AI-derived signals:"
)

pdf.table_row(["Factor", "Weight", "Description"], header=True)
pdf.table_row(["AI Similarity", "35%", "Semantic similarity from LLM analysis (inverted)"])
pdf.table_row(["Status Mismatch", "25%", "Binary penalty if HTTP status codes differ"])
pdf.table_row(["Field Diff Count", "20%", "Number of changed fields (capped to prevent outliers)"])
pdf.table_row(["Structure Change", "10%", "Penalty for added/removed top-level keys"])
pdf.table_row(["Latency Delta", "10%", "Significant response time regression"])
pdf.ln(2)

pdf.body_text(
    "The final score maps to severity levels: None (0-1), Low (1-3), Medium (3-5), High (5-7), and Critical (7-10), "
    "with corresponding deployment recommendations: SAFE_TO_PROMOTE, REVIEW_RECOMMENDED, or BLOCK_DEPLOYMENT."
)

# 5. Dashboard
pdf.section_title("5. Dashboard and User Interface")
pdf.body_text(
    "The React 18 dashboard (TypeScript, Vite) provides comprehensive visibility into deployment health through six "
    "primary views:"
)

pdf.bullet("Overview Page - Displays KPIs (total requests, mismatch rate, aggregate risk score, latency delta), a risk "
    "gauge with deployment recommendation, configurable trend charts (7/14/30 days) using Recharts, severity breakdown "
    "donut chart, top mismatched endpoints, and one-click PDF/CSV export.")
pdf.bullet("Endpoint Analysis - Filterable, paginated table of all comparisons with severity-coded badges, filtering "
    "by endpoint, HTTP method, severity, and time range.")
pdf.bullet("Comparison Detail - Side-by-side JSON diff viewer, field-level diff table showing path, operation, old/new "
    "values, AI analysis panel with summary, impact assessment, and confidence score.")
pdf.bullet("Quick Configure - Guided wizard for setting up traffic routing via natural language input.")
pdf.bullet("Website Testing - Live URL-pair comparison tool for ad-hoc validation of any two endpoints.")
pdf.bullet("Notifications - Configurable Slack, email (SMTP), and webhook alerts with risk score thresholds.")

# 6. CI/CD
pdf.section_title("6. CI/CD Integration and Deployment Strategy")
pdf.body_text(
    "Shadow-Deploy integrates into GitHub Actions CI/CD pipelines as an automated quality gate: (1) build and deploy the "
    "new API version as a shadow container, (2) configure NGINX mirroring at a specified percentage (e.g., 10% for gradual "
    "rollout), (3) collect comparison data over a configurable window (default 300 seconds), (4) fetch the aggregate risk "
    "score from the API Service, and (5) automatically promote or block the deployment based on a configurable threshold - "
    "with Slack/email notifications containing the full risk report."
)
pdf.body_text(
    "This transforms deployment from a binary pass/fail decision into a data-driven, AI-informed confidence assessment "
    "using real production traffic. The platform supports multi-tenant isolation via database-level RLS, scoped API keys "
    "with SHA-256 hashing and expiration, and PII-aware processing ensuring compliance when using external LLMs."
)

# 7. Key Contributions
pdf.section_title("7. Key Contributions")
pdf.bullet("Real Traffic Validation - Uses actual production traffic instead of synthetic tests, catching edge cases "
    "that staging environments miss.")
pdf.bullet("Semantic AI Analysis - Distinguishes breaking changes from safe improvements using Google Gemini with "
    "pluggable LLM architecture (cloud, local, heuristic).")
pdf.bullet("Automatic Noise Detection - Auto-learns which fields to ignore (>80% threshold), reducing false positives "
    "while maintaining full transparency in reports.")
pdf.bullet("PII-Aware Processing - Regex-based masking of sensitive data (emails, SSNs, credit cards, API keys) before "
    "any external LLM processing, ensuring data privacy compliance.")
pdf.bullet("Multi-Tenant Isolation - Database-level Row-Level Security (RLS), scoped API keys, and JWT-based tenant "
    "extraction for enterprise-grade data segregation.")
pdf.bullet("Zero User Impact - Shadow responses are captured but never returned to users, ensuring production stability "
    "throughout the entire validation process.")

output_path = r"c:\Users\91986\OneDrive\Pictures\shadow-deploy\Shadow_Deploy_Project_Overview.pdf"
pdf.output(output_path)
print(f"PDF generated: {output_path}")
