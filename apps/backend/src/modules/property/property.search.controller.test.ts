import type { Request, Response } from "express";
import { searchPropertiesController } from "./property.search.controller";
import { searchPropertiesService } from "./property.search.service";

jest.mock("./property.search.service");

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ query: {}, ...data } as any);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => jest.clearAllMocks());

describe("searchPropertiesController", () => {
    it("returns 400 if lat and lng are missing", async () => {
        const req = mockRequest({ query: {} });
        const res = mockResponse();

        await searchPropertiesController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "lat and lng are required for search"
        });
    });

    it("searches properties successfully", async () => {
        const req = mockRequest({
            query: {
                lat: "18.5204",
                lng: "73.8567",
                radius: "5",
                page: "1",
                limit: "10"
            }
        });
        const res = mockResponse();

        const mockResults = {
            page: 1,
            limit: 10,
            results: [{ id: "prop1", title: "Nice Apartment" }]
        };
        (searchPropertiesService as jest.Mock).mockResolvedValue(mockResults);

        await searchPropertiesController(req, res);

        expect(searchPropertiesService).toHaveBeenCalledWith({
            lat: 18.5204,
            lng: 73.8567,
            radiusKm: 5,
            gender: undefined,
            sharingLte: undefined,
            minRent: undefined,
            maxRent: undefined,
            page: 1,
            limit: 10
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, ...mockResults });
    });

    it("searches with filters", async () => {
        const req = mockRequest({
            query: {
                lat: "18.5204",
                lng: "73.8567",
                gender: "MALE",
                sharing_lte: "2",
                minRent: "5000",
                maxRent: "15000"
            }
        });
        const res = mockResponse();

        (searchPropertiesService as jest.Mock).mockResolvedValue({ page: 1, limit: 10, results: [] });

        await searchPropertiesController(req, res);

        expect(searchPropertiesService).toHaveBeenCalledWith(expect.objectContaining({
            gender: "MALE",
            sharingLte: 2,
            minRent: 5000,
            maxRent: 15000
        }));
    });

    it("returns 500 on unexpected error", async () => {
        const req = mockRequest({ query: { lat: "18.5204", lng: "73.8567" } });
        const res = mockResponse();

        (searchPropertiesService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await searchPropertiesController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});