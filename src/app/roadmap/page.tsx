"use client";

import {
  ArrowRight,
  CheckCircle,
  Cloud,
  Clock,
  Database,
  FolderOpen,
  Layout,
  Map,
  PlayCircle,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import PageContainer from "@/components/PageContainer";

const roadmaps = [
  {
    id: "frontend",
    title: "Front-end Developer",
    description: "Tập trung vào giao diện, trải nghiệm người dùng và các công nghệ web hiện đại.",
    icon: Layout,
    gradient: "from-indigo-500 to-violet-500",
    surface: "from-indigo-50 to-violet-50",
    iconClass: "text-indigo-700",
    borderClass: "border-indigo-100",
    stats: { courses: 8, duration: "8-12 tháng", students: "45k+" },
    tags: ["React", "Next.js", "Tailwind"],
    groups: ["role-based", "web"],
    fit: "Phù hợp nếu bạn muốn đi từ HTML/CSS đến SPA, SSR và UI system.",
    badge: "Phổ biến",
    badgeClass: "bg-indigo-100 text-indigo-700"
  },
  {
    id: "backend",
    title: "Back-end Developer",
    description: "Đi sâu vào API, dữ liệu, xác thực và vận hành dịch vụ phía server.",
    icon: Server,
    gradient: "from-violet-500 to-fuchsia-500",
    surface: "from-violet-50 to-fuchsia-50",
    iconClass: "text-violet-700",
    borderClass: "border-violet-100",
    stats: { courses: 10, duration: "10-15 tháng", students: "32k+" },
    tags: ["Node.js", "MySQL", "Microservices"],
    groups: ["role-based", "web"],
    fit: "Phù hợp nếu bạn thích logic hệ thống, hiệu năng và làm việc với dữ liệu.",
    badge: "Nền tảng vững chắc",
    badgeClass: "bg-violet-100 text-violet-700"
  },
  {
    id: "fullstack",
    title: "Full-stack Developer",
    description: "Xây nền tảng toàn diện để tự triển khai sản phẩm từ giao diện đến hệ thống.",
    icon: Database,
    gradient: "from-indigo-500 to-purple-500",
    surface: "from-indigo-50 to-purple-50",
    iconClass: "text-indigo-700",
    borderClass: "border-indigo-100",
    stats: { courses: 15, duration: "12-18 tháng", students: "28k+" },
    tags: ["MERN Stack", "DevOps", "System Design"],
    groups: ["role-based", "web"],
    fit: "Phù hợp nếu bạn muốn hiểu toàn bộ vòng đời xây dựng và phát hành sản phẩm.",
    badge: "Toàn diện",
    badgeClass: "bg-indigo-100 text-indigo-700"
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    description: "Phát triển ứng dụng di động đa nền tảng với tư duy sản phẩm và tối ưu trải nghiệm.",
    icon: Smartphone,
    gradient: "from-purple-500 to-indigo-500",
    surface: "from-purple-50 to-indigo-50",
    iconClass: "text-purple-700",
    borderClass: "border-purple-100",
    stats: { courses: 12, duration: "8-12 tháng", students: "22k+" },
    tags: ["React Native", "iOS", "Android"],
    groups: ["role-based", "mobile"],
    fit: "Phù hợp nếu bạn muốn build app thực tế cho mobile và triển khai đa nền tảng.",
    badge: "Ứng dụng thực tế",
    badgeClass: "bg-purple-100 text-purple-700"
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    description: "Kết nối phát triển phần mềm với triển khai, giám sát và tự động hóa hạ tầng.",
    icon: Cloud,
    gradient: "from-slate-700 to-indigo-600",
    surface: "from-slate-50 to-indigo-50",
    iconClass: "text-slate-700",
    borderClass: "border-slate-200",
    stats: { courses: 14, duration: "10-15 tháng", students: "18k+" },
    tags: ["AWS", "Docker", "Kubernetes"],
    groups: ["role-based", "devops"],
    fit: "Phù hợp nếu bạn muốn làm chủ CI/CD, cloud và độ ổn định của hệ thống.",
    badge: "Hạ tầng & tự động hóa",
    badgeClass: "bg-slate-200 text-slate-700"
  }
];

const quickActions = [
  {
    title: "Tạo roadmap với AI",
    description: "Tạo lộ trình theo mục tiêu nghề nghiệp, thời gian học và nền tảng hiện tại.",
    href: "/roadmap/generate",
    icon: Sparkles,
    tone: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 text-slate-900 shadow-sm",
    iconWrap: "bg-indigo-100 text-indigo-600",
    bodyClass: "text-slate-600",
    cta: "Bắt đầu ngay"
  },
  {
    title: "Mở roadmap của tôi",
    description: "Quay lại lộ trình đã lưu. Bạn có thể tiếp tục phần đang học và theo dõi tiến độ hiện tại.",
    href: "/roadmap/my",
    icon: PlayCircle,
    tone: "bg-white text-slate-900 border-slate-200",
    iconWrap: "bg-violet-100 text-violet-600",
    bodyClass: "text-slate-500",
    cta: "Xem tiến độ"
  },
  {
    title: "Khám phá thư viện roadmap",
    description: "Duyệt các lộ trình được biên soạn sẵn theo vai trò, kỹ năng và thời lượng học.",
    href: "#roadmap-catalog",
    icon: Map,
    tone: "bg-white text-slate-900 border-slate-200",
    iconWrap: "bg-indigo-100 text-indigo-700",
    bodyClass: "text-slate-500",
    cta: "Mở thư viện"
  }
];

const flowSteps = [
  {
    title: "Chọn mục tiêu",
    description: "Bắt đầu từ roadmap chuẩn hoặc chọn AI nếu bạn chưa rõ thứ tự kỹ năng cần học.",
    icon: Target
  },
  {
    title: "Tùy chỉnh lộ trình",
    description: "Tinh chỉnh theo quỹ thời gian, nền tảng hiện tại và vai trò bạn đang hướng tới.",
    icon: Zap
  },
  {
    title: "Bắt đầu học tập",
    description: "Theo dõi tiến độ theo từng chặng, quay lại phần đang học và điều chỉnh khi cần.",
    icon: CheckCircle
  }
];

const features = [
  {
    title: "Sự rõ ràng",
    description: "Bạn nhìn thấy ngay điểm bắt đầu, kỹ năng cốt lõi và lộ trình phát triển cho từng vai trò.",
    icon: Target,
    color: "text-indigo-700",
    bg: "bg-indigo-100"
  },
  {
    title: "Theo dõi tiến độ",
    description: "Lộ trình đã lưu giúp bạn quay lại nhanh, tiếp tục phần dang dở và giữ nhịp học ổn định.",
    icon: Trophy,
    color: "text-violet-700",
    bg: "bg-violet-100"
  },
  {
    title: "Linh hoạt",
    description: "Bạn có thể chuyển giữa roadmap chuẩn và roadmap AI mà không phải rời khỏi cùng một luồng học.",
    icon: Shield,
    color: "text-indigo-700",
    bg: "bg-indigo-100"
  },
  {
    title: "Ít ma sát hơn",
    description: "Các hành động chính được gom lại để bạn ra quyết định nhanh thay vì phải tìm đường trong giao diện.",
    icon: Users,
    color: "text-slate-700",
    bg: "bg-slate-200"
  }
];

const roadmapGroups = [
  {
    id: "all",
    label: "Tất cả",
    description: "Xem toàn bộ lộ trình đang có để so sánh nhanh các hướng đi phổ biến."
  },
  {
    id: "role-based",
    label: "Role-based",
    description: "Các lộ trình theo vai trò nghề nghiệp, phù hợp khi bạn đã có mục tiêu công việc rõ ràng."
  },
  {
    id: "web",
    label: "Web",
    description: "Tập trung vào các kỹ năng xây dựng sản phẩm web từ giao diện đến hệ thống phía sau."
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "Dành cho người muốn phát triển ứng dụng di động với trải nghiệm native hoặc đa nền tảng."
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Nhóm lộ trình về hạ tầng, tự động hóa triển khai và vận hành hệ thống ổn định."
  }
];

export default function RoadmapPage() {
  const [activeGroup, setActiveGroup] = useState("all");

  const filteredRoadmaps =
    activeGroup === "all"
      ? roadmaps
      : roadmaps.filter((roadmap) => roadmap.groups.includes(activeGroup));

  const groupCounts = roadmapGroups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.id] =
      group.id === "all"
        ? roadmaps.length
        : roadmaps.filter((roadmap) => roadmap.groups.includes(group.id)).length;

    return accumulator;
  }, {});

  const activeGroupMeta =
    roadmapGroups.find((group) => group.id === activeGroup) ?? roadmapGroups[0];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#ffffff_22%,#ffffff_100%)] text-slate-900">
      <PageContainer size="lg" className="py-10 lg:py-14">
        <div className="mx-auto max-w-[960px]">
          <main className="flex flex-col gap-8">
            <section className="flex flex-col gap-6 px-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
                <Map className="h-4 w-4" />
                Roadmap học tập
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Khám phá lộ trình học tập kỹ thuật</h1>
                  <p className="mt-3 text-lg leading-8 text-slate-500">
                    Bắt đầu hành trình của bạn với một kế hoạch học tập được cá nhân hóa, hoặc khám phá các lộ trình chuyên môn được thiết kế sẵn.
                  </p>
                </div>
                <Link
                  href="/roadmap/generate"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#6366f1,#9333ea)] px-6 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-opacity hover:opacity-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Tạo lộ trình AI
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link
                      href={action.href}
                      className={`group flex h-full flex-col gap-3 rounded-2xl border p-5 transition-colors ${action.tone} ${index === 0 ? "" : "shadow-sm hover:border-indigo-200"}`}
                    >
                      <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl ${action.iconWrap} transition-transform group-hover:scale-110`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold leading-tight">{action.title}</h3>
                      <p className={`text-sm leading-6 ${action.bodyClass}`}>{action.description}</p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-indigo-600">
                        {action.cta}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="mt-4 flex flex-col gap-6 px-4" id="roadmap-catalog">
              <div className="mb-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Danh mục lộ trình phổ biến</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Chọn nhanh một hướng đi phù hợp và vào thẳng roadmap bạn muốn học.
                  </p>
                </div>
                <Link href="/roadmap" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Lọc theo danh mục</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {activeGroupMeta.description}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                    {filteredRoadmaps.length} lộ trình
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Lọc roadmap theo danh mục">
                  {roadmapGroups.map((group) => {
                    const isActive = group.id === activeGroup;

                    return (
                      <motion.button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveGroup(group.id)}
                        aria-pressed={isActive}
                        role="tab"
                        aria-selected={isActive}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                            : "border border-indigo-100 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        <span>{group.label}</span>
                        <span
                          className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs ${
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {groupCounts[group.id]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Đang chọn <span className="font-semibold text-indigo-700">{activeGroupMeta.label}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredRoadmaps.map((roadmap, index) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/roadmap/${roadmap.id}`} className="block h-full">
                      <article className={`flex h-full flex-col rounded-[24px] border bg-white p-5 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md ${roadmap.borderClass}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roadmap.gradient} text-white shadow-sm`}>
                            <roadmap.icon className="h-6 w-6" />
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${roadmap.badgeClass}`}>
                            {roadmap.badge}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-1 flex-col">
                          <h3 className="text-lg font-bold tracking-tight text-slate-900">{roadmap.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{roadmap.description}</p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{roadmap.fit}</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <Clock className="h-3.5 w-3.5" />
                            {roadmap.stats.duration}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <FolderOpen className="h-3.5 w-3.5" />
                            {roadmap.stats.courses} khóa học
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {roadmap.tags.map((tag) => (
                              <span key={tag} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                            Xem roadmap
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </PageContainer>

      <section className="border-y border-slate-200 bg-white py-16 lg:py-20">
        <PageContainer size="lg">
          <div className="mx-auto grid max-w-[960px] gap-6 lg:grid-cols-[0.9fr_minmax(0,1.1fr)] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo-700">Cách thức hoạt động</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
                Cách roadmap giúp bạn đi từ định hướng đến hành động
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 lg:text-base">
                Mọi thứ trên trang được gom lại theo một luồng đơn giản để bạn chọn hướng đi, cá nhân hóa khi cần và bắt đầu học ngay.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {flowSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[24px] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="py-16 lg:py-20">
        <PageContainer size="lg">
          <div className="mx-auto max-w-[960px]">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo-700">Lợi ích khi học bằng roadmap</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
                Một giao diện giúp người học ra quyết định dễ hơn
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 lg:text-base">
              Trang roadmap không nên khiến người dùng phải suy nghĩ quá nhiều. Nó nên giúp họ hiểu mình đang ở đâu, nên học gì tiếp theo và bắt đầu bằng cách nào.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-[26px] border border-slate-200 bg-white p-6 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-[30px] border border-slate-200 bg-slate-950 p-8 text-white lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-10">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo-300">Bạn cần hỗ trợ?</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight lg:text-3xl">
                Nếu bạn chưa rõ nên chọn roadmap nào, hãy bắt đầu bằng AI rồi quay lại thư viện để đối chiếu.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300 lg:text-base">
                Đây là cách ít ma sát nhất để bắt đầu, đặc biệt khi bạn đang đổi hướng hoặc chưa tự tin về trình độ hiện tại.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
              <Link
                href="/roadmap/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
              >
                Tạo roadmap AI
                <Sparkles className="h-4 w-4" />
              </Link>
              <Link
                href="/roadmap/my"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Mở roadmap của tôi
                <FolderOpen className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition-colors hover:bg-indigo-400/15"
              >
                Nhận hỗ trợ
                <Users className="h-4 w-4" />
              </Link>
            </div>
          </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}