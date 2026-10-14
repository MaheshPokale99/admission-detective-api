import type { ResourcesRepository } from "./resources.repository.js";
import type { Resource } from "./resources.types.js";

export class ResourcesService {
    constructor(private readonly resources: ResourcesRepository) {}

    list(): Promise<Resource[]> {
        return this.resources.findAll();
    }
}
