import type { Logger } from "./common/logger/logger.js";
import type { AppConfig } from "./config/env.js";
import { Database } from "./database/database.js";
import { createEmailSender, type EmailSender } from "./integrations/email/email-sender.js";
import type { GenerateFn } from "./modules/agent/agent.types.js";
import { DetectiveAgent } from "./modules/agent/detective-agent.js";
import { createGenerateFn } from "./modules/agent/gemini.client.js";
import { AgentToolbox } from "./modules/agent/toolbox.js";
import { AuditRepository } from "./modules/audit/audit.repository.js";
import { InterventionsController } from "./modules/interventions/interventions.controller.js";
import { InterventionsRepository } from "./modules/interventions/interventions.repository.js";
import { InterventionsService } from "./modules/interventions/interventions.service.js";
import { InvestigationsController } from "./modules/investigations/investigations.controller.js";
import { InvestigationsRepository } from "./modules/investigations/investigations.repository.js";
import { InvestigationsService } from "./modules/investigations/investigations.service.js";
import { LeadsController } from "./modules/leads/leads.controller.js";
import { LeadsRepository } from "./modules/leads/leads.repository.js";
import { LeadsService } from "./modules/leads/leads.service.js";
import { MessagesRepository } from "./modules/messages/messages.repository.js";
import { MetricsController } from "./modules/metrics/metrics.controller.js";
import { MetricsService } from "./modules/metrics/metrics.service.js";
import { OutcomesController } from "./modules/outcomes/outcomes.controller.js";
import { OutcomesRepository } from "./modules/outcomes/outcomes.repository.js";
import { OutcomesService } from "./modules/outcomes/outcomes.service.js";
import { ResourcesController } from "./modules/resources/resources.controller.js";
import { ResourcesRepository } from "./modules/resources/resources.repository.js";
import { ResourcesService } from "./modules/resources/resources.service.js";
import { SystemController } from "./modules/system/system.controller.js";
import { SystemService } from "./modules/system/system.service.js";

export interface ContainerOverrides {
    database?: Database;
    generate?: GenerateFn;
    emailSender?: EmailSender;
}

export type Container = ReturnType<typeof createContainer>;

/** Composition root: builds every repository, service and controller once and wires their dependencies. */
export function createContainer(config: AppConfig, logger: Logger, overrides: ContainerOverrides = {}) {
    const database = overrides.database ?? Database.create(config.database);

    const repositories = {
        leads: new LeadsRepository(database),
        messages: new MessagesRepository(database),
        resources: new ResourcesRepository(database),
        investigations: new InvestigationsRepository(database),
        interventions: new InterventionsRepository(database),
        outcomes: new OutcomesRepository(database),
        audit: new AuditRepository(database),
    };

    const emailSender = overrides.emailSender ?? createEmailSender(config.email);

    const leads = new LeadsService({ ...repositories, rules: config.rules });

    const agent = new DetectiveAgent({
        generate: overrides.generate ?? createGenerateFn(config.gemini),
        toolbox: new AgentToolbox(repositories.resources, repositories.interventions),
        model: config.gemini.model,
        logger,
    });

    const investigations = new InvestigationsService({
        leads,
        messages: repositories.messages,
        resources: repositories.resources,
        investigations: repositories.investigations,
        interventions: repositories.interventions,
        audit: repositories.audit,
        transactions: database,
        agent,
    });

    const interventions = new InterventionsService({
        interventions: repositories.interventions,
        leads,
        leadsRepository: repositories.leads,
        messages: repositories.messages,
        audit: repositories.audit,
        email: emailSender,
        transactions: database,
        logger,
    });

    const outcomes = new OutcomesService({
        outcomes: repositories.outcomes,
        interventions: repositories.interventions,
        leads: repositories.leads,
        messages: repositories.messages,
        audit: repositories.audit,
        transactions: database,
    });

    const metrics = new MetricsService(leads, repositories.interventions);
    const resources = new ResourcesService(repositories.resources);
    const system = new SystemService(database, config);

    return {
        config,
        logger,
        database,
        emailSender,
        repositories,
        controllers: {
            leads: new LeadsController(leads),
            investigations: new InvestigationsController(investigations),
            interventions: new InterventionsController(interventions),
            outcomes: new OutcomesController(outcomes),
            metrics: new MetricsController(metrics),
            resources: new ResourcesController(resources),
            system: new SystemController(system),
        },
    };
}
