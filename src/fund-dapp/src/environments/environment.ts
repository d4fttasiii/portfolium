// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  currency: 'MATIC',
  contracts: {
    fund: "0xc603c81F09365A6B19CE4909aB4dC6B1e95CD711",
    oracle: "0x9bd8dc56e8a01fd0389e74a65fb9Cba7D28804E6",
    treasury: "0xD86AbB2249623538738ec99848403B38fa0a09AF",
    reserve: "0xb204E04a20f2257686C53371527DfD5a84211D75",
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
