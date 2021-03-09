/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
type ActionMap<M extends { [index: string]: any }> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export enum Types {
    COLUMS = 'CHANGE_COLUMS',
    SET_VISUALS = 'SET_VISUALS',
    CHANGE_VISUALS = 'CHANGE_VISUALS',
}

type Visuals = {
    name: string;
    title: string;
    checked: boolean;
};

type InitialStateType = {
    columnActive: number;
    visuals: Visuals[];
    // layoutReport: any;
    // layoutPageName: any;
    margin: number;
    minPageWidth: number;
};

type ColumsPayload = {
    [Types.COLUMS]: {
        colum: number;
    };
    [Types.SET_VISUALS]: {
        visuals: Visuals[];
    };
    [Types.CHANGE_VISUALS]: {
        name: string;
    };
};

export type ReportActions = ActionMap<ColumsPayload>[keyof ActionMap<ColumsPayload>];

export const reportReducer = (state: InitialStateType, action: ReportActions) => {
    switch (action.type) {
        case Types.COLUMS:
            return {
                ...state,
                columnActive: action.payload.colum,
            };
        case Types.SET_VISUALS:
            return { ...state, visuals: action.payload.visuals };
        case Types.CHANGE_VISUALS:
            return {
                ...state,
                visuals: state.visuals.map((visual) => {
                    if (visual.name === action.payload.name) {
                        return {
                            ...visual,
                            checked: !visual.checked,
                        };
                    } else return visual;
                }),
            };
        default:
            return state;
    }
};
