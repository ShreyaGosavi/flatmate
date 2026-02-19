import type { Request, Response } from "express";
import {
    savePropertyController,
    unsavePropertyController,
    getSavedPropertiesController
} from "./property.save.controller";
import {
    savePropertyService,
    unsavePropertyService,
    getSavedPropertiesService
} from "./property.save.service";

jest.mock("./property.save.service");

const mockRequest = (data: Partial<Request> = {}): Request =>
    ({ params: {}, user: { id: "user1" }, ...data } as any);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => jest.clearAllMocks());

describe("savePropertyController", () => {
    it("saves property successfully", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (savePropertyService as jest.Mock).mockResolvedValue(undefined);

        await savePropertyController(req, res);

        expect(savePropertyService).toHaveBeenCalledWith("user1", "prop1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 500 on error", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (savePropertyService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await savePropertyController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("unsavePropertyController", () => {
    it("unsaves property successfully", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (unsavePropertyService as jest.Mock).mockResolvedValue(undefined);

        await unsavePropertyController(req, res);

        expect(unsavePropertyService).toHaveBeenCalledWith("user1", "prop1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 500 on error", async () => {
        const req = mockRequest({ params: { propertyId: "prop1" } });
        const res = mockResponse();

        (unsavePropertyService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await unsavePropertyController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("getSavedPropertiesController", () => {
    it("returns 401 if user is not authenticated", async () => {
        const req = mockRequest({ user: undefined });
        const res = mockResponse();

        await getSavedPropertiesController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns saved properties successfully", async () => {
        const req = mockRequest();
        const res = mockResponse();

        const mockSaved = [{ Property: { id: "prop1", title: "Nice Apartment" } }];
        (getSavedPropertiesService as jest.Mock).mockResolvedValue(mockSaved);

        await getSavedPropertiesController(req, res);

        expect(getSavedPropertiesService).toHaveBeenCalledWith("user1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, results: mockSaved });
    });

    it("returns 500 on error", async () => {
        const req = mockRequest();
        const res = mockResponse();

        (getSavedPropertiesService as jest.Mock).mockRejectedValue(new Error("DB error"));

        await getSavedPropertiesController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});