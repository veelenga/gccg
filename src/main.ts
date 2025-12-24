import './style.css';
import { UI } from './ui/ui';

new UI();

if (import.meta.hot) {
  import.meta.hot.accept();
}
