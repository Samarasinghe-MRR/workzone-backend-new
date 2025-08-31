import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("JobController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let createdJobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Mock JWT token for testing (in real scenario, get from Auth Service)
    jwtToken = "mock-jwt-token-for-testing";
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("/jobs (GET)", () => {
    it("should return paginated jobs list", () => {
      return request(app.getHttpServer())
        .get("/jobs?page=1&limit=10")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("jobs");
          expect(res.body).toHaveProperty("pagination");
          expect(Array.isArray(res.body.jobs)).toBeTruthy();
        });
    });

    it("should filter jobs by category", () => {
      return request(app.getHttpServer())
        .get("/jobs?category=Plumbing")
        .expect(200);
    });

    it("should filter jobs by location radius", () => {
      return request(app.getHttpServer())
        .get("/jobs?lat=40.7128&lng=-74.0060&radius=10")
        .expect(200);
    });
  });

  describe("/jobs (POST)", () => {
    it("should create a new job with valid data", () => {
      const createJobDto = {
        title: "Test Plumbing Job",
        description: "Test description for plumbing job",
        category: "Plumbing",
        location: "Test Location",
        location_lat: 40.7128,
        location_lng: -74.006,
        budget_min: 100,
        budget_max: 300,
        priority: "HIGH",
        job_type: "ONE_TIME",
        deadline: "2025-09-01T10:00:00Z",
        requirements: ["Licensed plumber"],
      };

      return request(app.getHttpServer())
        .post("/jobs")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send(createJobDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.title).toBe(createJobDto.title);
          expect(res.body.status).toBe("PENDING");
          createdJobId = res.body.id;
        });
    });

    it("should return 401 when no auth token provided", () => {
      return request(app.getHttpServer())
        .post("/jobs")
        .send({
          title: "Test Job",
          description: "Test description",
        })
        .expect(401);
    });

    it("should return 400 when required fields are missing", () => {
      return request(app.getHttpServer())
        .post("/jobs")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send({
          description: "Missing title",
        })
        .expect(400);
    });
  });

  describe("/jobs/:id (GET)", () => {
    it("should return job by ID", () => {
      return request(app.getHttpServer())
        .get(`/jobs/${createdJobId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdJobId);
          expect(res.body).toHaveProperty("title");
          expect(res.body).toHaveProperty("description");
        });
    });

    it("should return 404 for non-existent job", () => {
      return request(app.getHttpServer())
        .get("/jobs/non-existent-id")
        .expect(404);
    });
  });

  describe("/jobs/my-jobs (GET)", () => {
    it("should return current user jobs", () => {
      return request(app.getHttpServer())
        .get("/jobs/my-jobs")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it("should return 401 when no auth token", () => {
      return request(app.getHttpServer()).get("/jobs/my-jobs").expect(401);
    });
  });

  describe("/jobs/:id (PATCH)", () => {
    it("should update job successfully", () => {
      const updateData = {
        status: "OPEN",
        budget_max: 350,
        description: "Updated description",
      };

      return request(app.getHttpServer())
        .patch(`/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe("OPEN");
          expect(res.body.budget_max).toBe(350);
          expect(res.body.description).toBe("Updated description");
        });
    });

    it("should return 403 when trying to update other user job", () => {
      return request(app.getHttpServer())
        .patch(`/jobs/${createdJobId}`)
        .set("Authorization", "Bearer different-user-token")
        .send({ status: "CANCELLED" })
        .expect(403);
    });
  });

  describe("/jobs/:id/assign (POST)", () => {
    it("should assign job to provider", () => {
      const assignData = {
        serviceProviderId: "provider-123",
        quoteAmount: 250,
        estimatedDuration: "2 hours",
      };

      return request(app.getHttpServer())
        .post(`/jobs/${createdJobId}/assign`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .send(assignData)
        .expect(200)
        .expect((res) => {
          expect(res.body.job.status).toBe("IN_PROGRESS");
          expect(res.body.assignment).toHaveProperty("provider_id");
          expect(res.body.assignment.quote_amount).toBe(250);
        });
    });
  });

  describe("/jobs/:id/complete (POST)", () => {
    it("should complete job successfully", () => {
      return request(app.getHttpServer())
        .post(`/jobs/${createdJobId}/complete`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe("COMPLETED");
          expect(res.body).toHaveProperty("completed_at");
        });
    });
  });

  describe("/jobs/:id (DELETE)", () => {
    it("should delete job successfully", () => {
      return request(app.getHttpServer())
        .delete(`/jobs/${createdJobId}`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Job deleted successfully");
        });
    });

    it("should return 404 when trying to delete non-existent job", () => {
      return request(app.getHttpServer())
        .delete("/jobs/non-existent-id")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(404);
    });
  });
});
