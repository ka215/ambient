import { createManagementFormBindings } from '../ui/forms/management-form-bindings';
import { initializeManagementForms } from './management-init';

type CreateManagementBindingsOptions = Parameters<typeof createManagementFormBindings>[0];
type InitializeManagementFormsOptions = Parameters<typeof initializeManagementForms>[0];

export interface InitializeManagementBindingCompositionOptions {
  bindingOptions?: CreateManagementBindingsOptions;
  initOptions?: InitializeManagementFormsOptions;
}

export function initializeManagementBindingComposition(options: InitializeManagementBindingCompositionOptions): ReturnType<typeof createManagementFormBindings> | null {
  const bindings = options.bindingOptions ? createManagementFormBindings(options.bindingOptions) : null;
  if (options.initOptions) {
    initializeManagementForms(options.initOptions);
  }
  return bindings;
}
