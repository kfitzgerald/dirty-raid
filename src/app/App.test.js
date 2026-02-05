import { render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import App from './App';
import configureStore from "../configureStore";

test('renders learn react link', () => {
  const preloadedState = undefined;
  const store = configureStore(preloadedState);
  render(<Provider store={store}><App /></Provider>);
  const linkElement = screen.getByText(/DirtyRaid/i);
  expect(linkElement).toBeInTheDocument();
});
