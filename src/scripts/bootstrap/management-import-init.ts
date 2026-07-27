import {
  importPlaylistFromManagementFile,
  resolveManagementRelativeFilepath,
} from './management-import';

type ResolveRelativeFilepathOptions = Parameters<typeof resolveManagementRelativeFilepath>[0];
type ImportPlaylistFromManagementFileOptions = Parameters<typeof importPlaylistFromManagementFile>[0];

export function createManagementImportHelpers(options: {
  resolveRelativeFilepathOptions: Omit<ResolveRelativeFilepathOptions, 'basefile'>;
  importPlaylistOptions: Omit<ImportPlaylistFromManagementFileOptions, 'file'>;
}): {
  getRelativeFilepath(basefile: string): Promise<boolean>;
  importPlaylistFromFile(file: File): Promise<{ ok: boolean; message: string }>;
} {
  return {
    getRelativeFilepath: async (basefile: string): Promise<boolean> => {
      return resolveManagementRelativeFilepath({
        ...options.resolveRelativeFilepathOptions,
        basefile,
      });
    },
    importPlaylistFromFile: async (file: File): Promise<{ ok: boolean; message: string }> => {
      return importPlaylistFromManagementFile({
        ...options.importPlaylistOptions,
        file,
      });
    },
  };
}
