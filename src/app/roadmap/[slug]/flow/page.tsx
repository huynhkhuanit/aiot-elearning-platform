"use client";

import { notFound } from "next/navigation";
import RoadmapTreeView from "@/components/RoadmapTreeView";
import { use } from "react";

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative';
  status: 'available' | 'completed' | 'current' | 'locked';
  duration?: string;
  technologies?: string[];
  difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  children?: RoadmapNode[];
}

const roadmapFlows: Record<string, { title: string; data: RoadmapNode }> = {
  frontend: {
    title: "Lộ trình Front-end Developer",
    data: {
      id: "frontend-root",
      title: "Front-end Development",
      description: "Web Development",
      type: "core",
      status: "available",
      children: [
        {
          id: "internet",
          title: "Internet",
          description: "How does the internet work?",
          type: "core",
          status: "completed",
          duration: "1 week",
          children: [
            {
              id: "how-internet-works",
              title: "How does the internet work?",
              description: "Understanding the fundamentals of internet",
              type: "beginner",
              status: "completed",
              duration: "2 days"
            },
            {
              id: "what-is-http",
              title: "What is HTTP?",
              description: "HTTP protocol basics",
              type: "beginner",
              status: "completed",
              duration: "1 day"
            },
            {
              id: "domain-name",
              title: "What is Domain Name?",
              description: "Domain names and DNS",
              type: "beginner",
              status: "completed",
              duration: "1 day"
            },
            {
              id: "hosting",
              title: "What is hosting?",
              description: "Web hosting concepts",
              type: "beginner",
              status: "current",
              duration: "1 day"
            },
            {
              id: "dns",
              title: "DNS and how it works?",
              description: "Domain Name System",
              type: "beginner",
              status: "available",
              duration: "2 days"
            },
            {
              id: "browsers",
              title: "Browsers and how they work?",
              description: "Web browsers fundamentals",
              type: "beginner",
              status: "available",
              duration: "1 day"
            }
          ]
        },
        {
          id: "html-css-js",
          title: "HTML, CSS & JavaScript",
          description: "Core web technologies",
          type: "core",
          status: "current",
          children: [
            {
              id: "html",
              title: "HTML",
              description: "HyperText Markup Language",
              type: "core",
              status: "completed",
              duration: "2 weeks",
              technologies: ["HTML5", "Semantic HTML"]
            },
            {
              id: "css",
              title: "CSS",
              description: "Cascading Style Sheets",
              type: "core",
              status: "completed",
              duration: "3 weeks",
              technologies: ["CSS3", "Flexbox", "Grid"]
            },
            {
              id: "javascript",
              title: "JavaScript",
              description: "Programming language for web",
              type: "core",
              status: "current",
              duration: "4 weeks",
              technologies: ["ES6+", "DOM", "Async/Await"]
            }
          ]
        },
        {
          id: "package-managers",
          title: "Package Managers",
          description: "Dependency management",
          type: "optional",
          status: "available",
          children: [
            {
              id: "npm",
              title: "npm",
              description: "Node Package Manager",
              type: "optional",
              status: "available",
              duration: "1 week",
              technologies: ["npm", "package.json"]
            },
            {
              id: "yarn",
              title: "yarn",
              description: "Alternative package manager",
              type: "alternative",
              status: "available",
              duration: "1 week",
              technologies: ["yarn", "yarn.lock"]
            }
          ]
        },
        {
          id: "version-control",
          title: "Version Control",
          description: "Git and GitHub",
          type: "core",
          status: "available",
          children: [
            {
              id: "git-basics",
              title: "Git Basics",
              description: "Version control fundamentals",
              type: "core",
              status: "available",
              duration: "1 week",
              technologies: ["Git", "GitHub"]
            }
          ]
        },
        {
          id: "css-frameworks",
          title: "CSS Frameworks",
          description: "CSS libraries and frameworks",
          type: "optional",
          status: "available",
          children: [
            {
              id: "tailwind",
              title: "Tailwind CSS",
              description: "Utility-first CSS framework",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["Tailwind CSS", "Utility classes"]
            },
            {
              id: "bootstrap",
              title: "Bootstrap",
              description: "Popular CSS framework",
              type: "alternative",
              status: "available",
              duration: "2 weeks",
              technologies: ["Bootstrap", "Components"]
            }
          ]
        },
        {
          id: "javascript-frameworks",
          title: "JavaScript Frameworks",
          description: "Modern JS frameworks",
          type: "core",
          status: "available",
          children: [
            {
              id: "react",
              title: "React",
              description: "Component-based UI library",
              type: "core",
              status: "available",
              duration: "6 weeks",
              technologies: ["React", "JSX", "Hooks", "Context"]
            },
            {
              id: "vue",
              title: "Vue.js",
              description: "Progressive JS framework",
              type: "alternative",
              status: "available",
              duration: "5 weeks",
              technologies: ["Vue.js", "Vue CLI", "Composition API"]
            },
            {
              id: "angular",
              title: "Angular",
              description: "Full-featured framework",
              type: "alternative",
              status: "available",
              duration: "8 weeks",
              technologies: ["Angular", "TypeScript", "RxJS"]
            }
          ]
        }
      ]
    }
  },
  backend: {
    title: "Lộ trình Back-end Developer",
    data: {
      id: "backend-root",
      title: "Back-end Development",
      description: "Server-side Development",
      type: "core",
      status: "available",
      children: [
        {
          id: "internet-basics",
          title: "Internet Basics",
          description: "Understanding web fundamentals",
          type: "core",
          status: "completed",
          duration: "1 week",
          children: [
            {
              id: "how-internet-works-backend",
              title: "How does internet work?",
              description: "Network fundamentals",
              type: "beginner",
              status: "completed",
              duration: "2 days"
            },
            {
              id: "http-https",
              title: "HTTP/HTTPS",
              description: "Web protocols",
              type: "beginner",
              status: "completed",
              duration: "1 day"
            }
          ]
        },
        {
          id: "programming-language",
          title: "Programming Language",
          description: "Choose your language",
          type: "core",
          status: "current",
          children: [
            {
              id: "nodejs",
              title: "Node.js",
              description: "JavaScript runtime",
              type: "core",
              status: "current",
              duration: "4 weeks",
              technologies: ["Node.js", "npm", "Express"]
            },
            {
              id: "python",
              title: "Python",
              description: "Versatile programming language",
              type: "alternative",
              status: "available",
              duration: "4 weeks",
              technologies: ["Python", "Django", "Flask"]
            },
            {
              id: "php",
              title: "PHP",
              description: "Web development language",
              type: "alternative",
              status: "available",
              duration: "4 weeks",
              technologies: ["PHP", "Laravel", "Composer"]
            },
            {
              id: "java",
              title: "Java",
              description: "Enterprise-grade language",
              type: "alternative",
              status: "available",
              duration: "6 weeks",
              technologies: ["Java", "Spring Boot", "Maven"]
            }
          ]
        },
        {
          id: "database",
          title: "Database",
          description: "Data storage and management",
          type: "core",
          status: "available",
          children: [
            {
              id: "sql-databases",
              title: "SQL Databases",
              description: "Relational databases",
              type: "core",
              status: "available",
              duration: "3 weeks",
              children: [
                {
                  id: "mysql",
                  title: "MySQL",
                  description: "Popular relational database",
                  type: "core",
                  status: "available",
                  duration: "2 weeks",
                  technologies: ["MySQL", "SQL", "Indexes"]
                },
                {
                  id: "postgresql",
                  title: "PostgreSQL",
                  description: "Advanced open source database",
                  type: "alternative",
                  status: "available",
                  duration: "2 weeks",
                  technologies: ["PostgreSQL", "Advanced SQL"]
                }
              ]
            },
            {
              id: "nosql-databases",
              title: "NoSQL Databases",
              description: "Non-relational databases",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              children: [
                {
                  id: "mongodb",
                  title: "MongoDB",
                  description: "Document database",
                  type: "optional",
                  status: "available",
                  duration: "2 weeks",
                  technologies: ["MongoDB", "Documents", "Aggregation"]
                },
                {
                  id: "redis",
                  title: "Redis",
                  description: "In-memory data structure store",
                  type: "optional",
                  status: "available",
                  duration: "1 week",
                  technologies: ["Redis", "Caching", "Pub/Sub"]
                }
              ]
            }
          ]
        },
        {
          id: "api-development",
          title: "API Development",
          description: "Building web APIs",
          type: "core",
          status: "available",
          children: [
            {
              id: "rest-api",
              title: "REST API",
              description: "Representational State Transfer",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["REST", "HTTP Methods", "Status Codes"]
            },
            {
              id: "graphql",
              title: "GraphQL",
              description: "Query language for APIs",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["GraphQL", "Queries", "Mutations"]
            }
          ]
        },
        {
          id: "authentication",
          title: "Authentication & Security",
          description: "User authentication and security",
          type: "core",
          status: "available",
          children: [
            {
              id: "jwt",
              title: "JWT Authentication",
              description: "JSON Web Tokens",
              type: "core",
              status: "available",
              duration: "1 week",
              technologies: ["JWT", "OAuth", "Sessions"]
            },
            {
              id: "security",
              title: "Security Best Practices",
              description: "Application security",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["HTTPS", "CORS", "Input Validation"]
            }
          ]
        }
      ]
    }
  },
  fullstack: {
    title: "Lộ trình Full-stack Developer",
    data: {
      id: "fullstack-root",
      title: "Full-stack Development",
      description: "Complete web development",
      type: "core",
      status: "available",
      children: [
        {
          id: "frontend-basics",
          title: "Front-end Basics",
          description: "HTML, CSS, JavaScript fundamentals",
          type: "core",
          status: "available",
          duration: "6 weeks",
          children: [
            {
              id: "html-css",
              title: "HTML & CSS",
              description: "Web markup and styling",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["HTML5", "CSS3", "Responsive Design"]
            },
            {
              id: "javascript-fundamentals",
              title: "JavaScript Fundamentals",
              description: "Programming basics",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["ES6+", "DOM", "Async Programming"]
            }
          ]
        },
        {
          id: "frontend-advanced",
          title: "Advanced Front-end",
          description: "Modern frameworks and tools",
          type: "core",
          status: "available",
          children: [
            {
              id: "react-framework",
              title: "React Framework",
              description: "Component-based development",
              type: "core",
              status: "available",
              duration: "6 weeks",
              technologies: ["React", "Hooks", "Context", "Redux"]
            },
            {
              id: "build-tools",
              title: "Build Tools",
              description: "Development workflow",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["Webpack", "Babel", "NPM Scripts"]
            }
          ]
        },
        {
          id: "backend-development",
          title: "Back-end Development",
          description: "Server-side programming",
          type: "core",
          status: "available",
          children: [
            {
              id: "nodejs-backend",
              title: "Node.js Backend",
              description: "Server-side JavaScript",
              type: "core",
              status: "available",
              duration: "4 weeks",
              technologies: ["Node.js", "Express", "REST APIs"]
            },
            {
              id: "database-integration",
              title: "Database Integration",
              description: "Data persistence",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["MongoDB", "Mongoose", "Data Modeling"]
            }
          ]
        },
        {
          id: "deployment-devops",
          title: "Deployment & DevOps",
          description: "Production deployment",
          type: "optional",
          status: "available",
          children: [
            {
              id: "cloud-deployment",
              title: "Cloud Deployment",
              description: "Hosting applications",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["Heroku", "Vercel", "AWS"]
            },
            {
              id: "ci-cd",
              title: "CI/CD",
              description: "Continuous integration",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["GitHub Actions", "Docker", "Testing"]
            }
          ]
        }
      ]
    }
  },
  mobile: {
    title: "Lộ trình Mobile Developer",
    data: {
      id: "mobile-root",
      title: "Mobile Development",
      description: "Cross-platform mobile apps",
      type: "core",
      status: "available",
      children: [
        {
          id: "programming-basics",
          title: "Programming Basics",
          description: "Core programming concepts",
          type: "core",
          status: "available",
          duration: "4 weeks",
          children: [
            {
              id: "javascript-mobile",
              title: "JavaScript for Mobile",
              description: "JS programming fundamentals",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["JavaScript", "ES6+", "Async/Await"]
            },
            {
              id: "react-basics",
              title: "React Basics",
              description: "Component-based development",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["React", "JSX", "Props", "State"]
            }
          ]
        },
        {
          id: "react-native",
          title: "React Native",
          description: "Cross-platform framework",
          type: "core",
          status: "available",
          children: [
            {
              id: "rn-fundamentals",
              title: "React Native Fundamentals",
              description: "Mobile app development",
              type: "core",
              status: "available",
              duration: "4 weeks",
              technologies: ["React Native", "Expo", "Components"]
            },
            {
              id: "navigation",
              title: "Navigation",
              description: "App navigation patterns",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["React Navigation", "Stack", "Tab", "Drawer"]
            }
          ]
        },
        {
          id: "mobile-features",
          title: "Mobile Features",
          description: "Advanced mobile capabilities",
          type: "optional",
          status: "available",
          children: [
            {
              id: "device-features",
              title: "Device Features",
              description: "Camera, GPS, sensors",
              type: "optional",
              status: "available",
              duration: "3 weeks",
              technologies: ["Camera", "Location", "AsyncStorage"]
            },
            {
              id: "api-integration",
              title: "API Integration",
              description: "Backend communication",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["REST APIs", "GraphQL", "Authentication"]
            }
          ]
        }
      ]
    }
  },
  devops: {
    title: "Lộ trình DevOps Engineer",
    data: {
      id: "devops-root",
      title: "DevOps Engineering",
      description: "Infrastructure and deployment",
      type: "core",
      status: "available",
      children: [
        {
          id: "linux-basics",
          title: "Linux Basics",
          description: "Operating system fundamentals",
          type: "core",
          status: "available",
          duration: "3 weeks",
          children: [
            {
              id: "command-line",
              title: "Command Line",
              description: "Terminal and shell commands",
              type: "core",
              status: "available",
              duration: "1 week",
              technologies: ["Bash", "Terminal", "File System"]
            },
            {
              id: "system-admin",
              title: "System Administration",
              description: "Server management",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["Ubuntu", "Permissions", "Processes"]
            }
          ]
        },
        {
          id: "version-control",
          title: "Version Control",
          description: "Git and collaboration",
          type: "core",
          status: "available",
          children: [
            {
              id: "git-advanced",
              title: "Advanced Git",
              description: "Git workflows and tools",
              type: "core",
              status: "available",
              duration: "2 weeks",
              technologies: ["Git", "GitHub", "Branching Strategies"]
            }
          ]
        },
        {
          id: "cloud-platforms",
          title: "Cloud Platforms",
          description: "Cloud infrastructure",
          type: "core",
          status: "available",
          children: [
            {
              id: "aws-services",
              title: "AWS Services",
              description: "Amazon Web Services",
              type: "core",
              status: "available",
              duration: "4 weeks",
              technologies: ["EC2", "S3", "RDS", "Lambda"]
            },
            {
              id: "docker-containers",
              title: "Docker & Containers",
              description: "Containerization",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["Docker", "Docker Compose", "Images"]
            }
          ]
        },
        {
          id: "ci-cd-pipelines",
          title: "CI/CD Pipelines",
          description: "Automated deployment",
          type: "core",
          status: "available",
          children: [
            {
              id: "jenkins-github",
              title: "Jenkins & GitHub Actions",
              description: "CI/CD tools",
              type: "core",
              status: "available",
              duration: "3 weeks",
              technologies: ["Jenkins", "GitHub Actions", "Pipelines"]
            },
            {
              id: "monitoring",
              title: "Monitoring & Logging",
              description: "System monitoring",
              type: "optional",
              status: "available",
              duration: "2 weeks",
              technologies: ["Prometheus", "Grafana", "ELK Stack"]
            }
          ]
        }
      ]
    }
  }
};

export default function RoadmapFlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const roadmap = roadmapFlows[slug];

  if (!roadmap) {
    notFound();
  }

  return (
    <RoadmapTreeView
      roadmapId={slug}
      roadmapTitle={roadmap.title}
      roadmapData={roadmap.data}
    />
  );
}