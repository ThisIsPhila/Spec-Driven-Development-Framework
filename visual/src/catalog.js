export const INSTALL_COMMAND = 'git clone https://github.com/ThisIsPhila/Spec-Driven-Development-Framework.git .sdd-framework && bash .sdd-framework/scripts/setup.sh --profile general';
export const PROFILES = [
  ['general', 'General software projects', 'base'], ['web', 'Web interfaces', 'base'],
  ['api', 'Service contracts', 'base'], ['full-stack', 'Coordinated web and API', 'base'],
  ['mobile', 'Mobile applications', 'base'], ['cli', 'Command line applications', 'base'],
  ['monorepo', 'Coordinated repositories', 'base'], ['devsecops', 'Security considerations', 'modifier'],
  ['devops', 'Delivery and operations', 'modifier'], ['mlops', 'Model lifecycle', 'modifier'],
].map(([id, description, kind]) => ({ id, description, kind }));
