import { createReducer, on } from '@ngrx/store';
import { UIActions } from './ui.actions';
import { UIState } from './ui.state';

const initialState: UIState = {
  loading: {},
  errors: {},
  modals: {
    activeModal: null,
    modalData: null
  },
  notifications: []
};

export const uiReducer = createReducer(
  initialState,
  on(UIActions.setLoading, (state, { key, loading }) => ({
    ...state,
    loading: { ...state.loading, [key]: loading }
  })),
  on(UIActions.setError, (state, { key, error }) => ({
    ...state,
    errors: { ...state.errors, [key]: error }
  })),
  on(UIActions.openModal, (state, { modalId, data }) => ({
    ...state,
    modals: { activeModal: modalId, modalData: data }
  })),
  on(UIActions.closeModal, (state) => ({
    ...state,
    modals: { activeModal: null, modalData: null }
  }))
);
