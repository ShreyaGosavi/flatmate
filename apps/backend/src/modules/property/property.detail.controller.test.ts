import type { Request, Response } from "express";
import { getPropertyByIdController } from "./property.detail.controller";
import { getPropertyByIdService } from "./property.detail.service";

jest.mock("./property.detail.service");

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ params: {}, ...data } as any);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => jest.clearAllMocks());

describe("getPropertyByIdController", () => {
    it("returns 400 if propertyId is missing", async () => {
        const req = mockRequest({ params: {} });
        const res = mockResponse();

        await getPropertyByIdController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Property ID is required"
        });
    });

    it("returns 404 if property not found", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (getPropertyByIdService as jest.Mock).mockResolvedValue(null);

        await getPropertyByIdController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Property not found"
        });
    });

    it("returns property successfully", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        const mockProperty = { id: "prop1", title: "Nice Apartment" };
        (getPropertyByIdService as jest.Mock).mockResolvedValue(mockProperty);

        await getPropertyByIdController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, property: mockProperty });
    });

    it("returns 500 on unexpected error", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (getPropertyByIdService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await getPropertyByIdController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});