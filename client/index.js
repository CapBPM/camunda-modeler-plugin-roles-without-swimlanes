import { registerClientExtension, registerBpmnJSPlugin } from 'camunda-modeler-plugin-helpers';
import CAMUNDA_MODELER_ROLES_WITHOUT_SWIMLANES_PLUGIN from './candidate-group-plugin/CandidateGroupPlugin';
import PluginToggle from './candidate-group-plugin/PluginToggle';

registerBpmnJSPlugin(CAMUNDA_MODELER_ROLES_WITHOUT_SWIMLANES_PLUGIN)
registerClientExtension(PluginToggle)