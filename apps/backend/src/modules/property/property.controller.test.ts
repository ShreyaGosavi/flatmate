import type { Request, Response } from "express";
import { createPropertyController } from "./property.controller";
import { createPropertyService } from "./property.service";
import { sendAdminPropertySubmissionMail, sendUserPropertyConfirmationMail } from "@flatmate/email";

jest.mock("./property.service");
jest.mock("@flatmate/email");

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ body: {}, files: {}, user: { id: "user1", email: "test@test.com" }, ...data } as any);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => jest.clearAllMocks());

describe("createPropertyController", () => {
    const validBody = {
        title: "Nice Apartment",
        description: "A very nice apartment to live in comfortably",
        propertyType: "APARTMENT",
        rent: "10000",
        deposit: "20000",
        maintenance: "500",
        sharing: "2",
        genderPreference: "MALE",
        bhk: "TWO_BHK",
        addressLine1: "123 Main St",
        locality: "Baner",
        city: "Pune",
        district: "Pune",
        state: "Maharashtra",
        country: "India",
        postalCode: "411045",
        latitude: "18.5204",
        longitude: "73.8567",
        amenities: JSON.stringify(["WIFI", "AC"]),
    };

    it("returns 401 if user is not authenticated", async () => {
        const req = mockRequest({ user: undefined });
        const res = mockResponse();

        await createPropertyController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false });
    });

    it("returns 400 if body is invalid", async () => {
        const req = mockRequest({ body: {}, user: { id: "user1", email: "test@test.com" } as any });
        const res = mockResponse();

        await createPropertyController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates property successfully", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (createPropertyService as jest.Mock).mockResolvedValue({ propertyId: "prop1" });
        (sendAdminPropertySubmissionMail as jest.Mock).mockResolvedValue(undefined);
        (sendUserPropertyConfirmationMail as jest.Mock).mockResolvedValue(undefined);

        await createPropertyController(req, res);

        expect(createPropertyService).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true, propertyId: "prop1" });
    });

    it("returns 500 on unexpected error", async () => {
        const req = mockRequest({ body: validBody });
        const res = mockResponse();

        (createPropertyService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await createPropertyController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});