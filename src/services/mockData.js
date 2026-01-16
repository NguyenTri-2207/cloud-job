/**
 * Mock data cho development/testing
 * Backend có thể tham khảo format này để implement API
 */

export const mockJobs = [
  {
    _id: "1",
    title: "Senior Full Stack Developer",
    company: "TechCorp Vietnam",
    location: "Ho Chi Minh City",
    type: "Full-time",
    salary: "30,000,000 - 50,000,000 VND",
    description:
      "Chúng tôi đang tìm kiếm một Senior Full Stack Developer có kinh nghiệm với React, Node.js và AWS. Bạn sẽ tham gia vào việc phát triển các ứng dụng web hiện đại, làm việc với team agile và có cơ hội học hỏi các công nghệ mới nhất.",
    requirements:
      "• 5+ năm kinh nghiệm với JavaScript/TypeScript\n• Thành thạo React, Next.js, Node.js\n• Kinh nghiệm với AWS (Lambda, API Gateway, DynamoDB)\n• Hiểu biết về RESTful API và GraphQL\n• Kỹ năng làm việc nhóm tốt",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    _id: "2",
    title: "AWS Solutions Architect",
    company: "Cloud Solutions Inc",
    location: "Ha Noi",
    type: "Full-time",
    salary: "40,000,000 - 60,000,000 VND",
    description:
      "Vị trí AWS Solutions Architect cho phép bạn thiết kế và triển khai các giải pháp cloud trên AWS. Bạn sẽ làm việc trực tiếp với khách hàng để hiểu yêu cầu và đề xuất kiến trúc phù hợp nhất.",
    requirements:
      "• AWS Certified Solutions Architect (Associate hoặc Professional)\n• 3+ năm kinh nghiệm với AWS services\n• Hiểu biết sâu về serverless architecture\n• Kỹ năng giao tiếp và thuyết trình tốt\n• Kinh nghiệm với Infrastructure as Code (Terraform, CloudFormation)",
    createdAt: "2024-01-14T14:30:00Z",
  },
  {
    _id: "3",
    title: "DevOps Engineer",
    company: "StartupXYZ",
    location: "Da Nang",
    type: "Full-time",
    salary: "25,000,000 - 40,000,000 VND",
    description:
      "Tìm kiếm DevOps Engineer để quản lý CI/CD pipeline, infrastructure và monitoring. Môi trường làm việc năng động, có nhiều cơ hội phát triển.",
    requirements:
      "• Kinh nghiệm với Docker, Kubernetes\n• Thành thạo CI/CD tools (GitHub Actions, Jenkins)\n• Hiểu biết về monitoring và logging (CloudWatch, Prometheus)\n• Scripting skills (Bash, Python)\n• Kinh nghiệm với cloud platforms (AWS, GCP, Azure)",
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    _id: "4",
    title: "Frontend Developer (React)",
    company: "Digital Agency Pro",
    location: "Ho Chi Minh City",
    type: "Full-time",
    salary: "20,000,000 - 35,000,000 VND",
    description:
      "Tuyển Frontend Developer có đam mê với React và modern web development. Bạn sẽ làm việc trên các dự án client-side, tối ưu performance và UX.",
    requirements:
      "• 2+ năm kinh nghiệm với React\n• Thành thạo JavaScript/TypeScript\n• Hiểu biết về state management (Redux, Zustand)\n• Kinh nghiệm với CSS frameworks (Tailwind, Material-UI)\n• Portfolio với các projects thực tế",
    createdAt: "2024-01-12T16:45:00Z",
  },
  {
    _id: "5",
    title: "Backend Developer (Node.js)",
    company: "E-commerce Platform",
    location: "Ho Chi Minh City",
    type: "Full-time",
    salary: "25,000,000 - 45,000,000 VND",
    description:
      "Phát triển backend services cho nền tảng e-commerce lớn. Làm việc với microservices architecture, high-traffic systems và real-time features.",
    requirements:
      "• 3+ năm kinh nghiệm với Node.js\n• Thành thạo Express, NestJS hoặc Fastify\n• Kinh nghiệm với databases (MongoDB, PostgreSQL)\n• Hiểu biết về caching (Redis)\n• Kinh nghiệm với message queues (SQS, RabbitMQ)",
    createdAt: "2024-01-11T11:20:00Z",
  },
  {
    _id: "6",
    title: "Cloud Security Engineer",
    company: "Financial Services Co",
    location: "Ha Noi",
    type: "Full-time",
    salary: "35,000,000 - 55,000,000 VND",
    description:
      "Đảm bảo an ninh cho cloud infrastructure và applications. Làm việc với security policies, compliance và threat detection.",
    requirements:
      "• 4+ năm kinh nghiệm với cloud security\n• Chứng chỉ AWS Security hoặc tương đương\n• Hiểu biết về IAM, encryption, network security\n• Kinh nghiệm với security tools (WAF, GuardDuty)\n• Knowledge về compliance standards (SOC 2, ISO 27001)",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    _id: "7",
    title: "Full Stack Developer (Remote)",
    company: "Global Tech Company",
    location: "Remote",
    type: "Full-time",
    salary: "$2,000 - $3,500 USD",
    description:
      "Cơ hội làm việc remote cho công ty công nghệ quốc tế. Bạn sẽ làm việc với team đa quốc gia, flexible hours và competitive salary.",
    requirements:
      "• 4+ năm kinh nghiệm full stack development\n• Thành thạo React và Node.js\n• Kinh nghiệm với cloud services (AWS preferred)\n• Kỹ năng giao tiếp tiếng Anh tốt\n• Có thể làm việc độc lập và quản lý thời gian hiệu quả",
    createdAt: "2024-01-09T13:30:00Z",
  },
  {
    _id: "8",
    title: "Junior Software Engineer",
    company: "Tech Startup",
    location: "Ho Chi Minh City",
    type: "Full-time",
    salary: "15,000,000 - 25,000,000 VND",
    description:
      "Cơ hội cho các bạn mới ra trường hoặc có 1-2 năm kinh nghiệm. Môi trường học hỏi tốt, mentorship từ senior developers.",
    requirements:
      "• Tốt nghiệp đại học ngành CNTT hoặc tương đương\n• Có kiến thức cơ bản về programming (JavaScript, Python, Java)\n• Đam mê học hỏi và phát triển bản thân\n• Kỹ năng giải quyết vấn đề tốt\n• Portfolio hoặc GitHub với projects cá nhân",
    createdAt: "2024-01-08T10:15:00Z",
  },
  {
    _id: "9",
    title: "Data Engineer",
    company: "Big Data Analytics",
    location: "Ha Noi",
    type: "Full-time",
    salary: "30,000,000 - 50,000,000 VND",
    description:
      "Xây dựng data pipelines, ETL processes và data warehouses. Làm việc với large datasets và real-time data processing.",
    requirements:
      "• 3+ năm kinh nghiệm với data engineering\n• Thành thạo Python, SQL\n• Kinh nghiệm với data tools (Spark, Airflow, Kafka)\n• Hiểu biết về data warehousing (Redshift, BigQuery)\n• Kinh nghiệm với cloud data services (AWS Glue, EMR)",
    createdAt: "2024-01-07T15:00:00Z",
  },
  {
    _id: "10",
    title: "Mobile Developer (React Native)",
    company: "Mobile App Studio",
    location: "Ho Chi Minh City",
    type: "Full-time",
    salary: "22,000,000 - 38,000,000 VND",
    description:
      "Phát triển mobile applications cho iOS và Android sử dụng React Native. Làm việc với team design và backend để tạo ra trải nghiệm người dùng tuyệt vời.",
    requirements:
      "• 2+ năm kinh nghiệm với React Native\n• Hiểu biết về mobile app architecture\n• Kinh nghiệm với native modules và third-party libraries\n• Kỹ năng debugging và performance optimization\n• Portfolio với published apps",
    createdAt: "2024-01-06T12:00:00Z",
  },
];

/**
 * Simulate API delay
 */
function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock API: Get jobs list với pagination
 */
export async function mockGetJobsList(page = 1, limit = 10) {
  await delay(300); // Simulate network delay

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedJobs = mockJobs.slice(startIndex, endIndex);

  return {
    jobs: paginatedJobs,
    total: mockJobs.length,
    page,
    limit,
  };
}

/**
 * Mock API: Get job detail
 */
export async function mockGetJobDetail(jobId) {
  await delay(200);

  const job = mockJobs.find((j) => j._id === jobId || j.id === jobId);

  if (!job) {
    throw new Error("Job không tồn tại");
  }

  return job;
}

/**
 * Mock API: Submit application
 */
export async function mockSubmitApplication(jobId, cvFileKey) {
  await delay(500);

  const job = mockJobs.find((j) => j._id === jobId || j.id === jobId);

  if (!job) {
    throw new Error("Job không tồn tại");
  }

  return {
    success: true,
    applicationId: `app_${Date.now()}`,
    jobId,
    cvFileKey,
    submittedAt: new Date().toISOString(),
  };
}
