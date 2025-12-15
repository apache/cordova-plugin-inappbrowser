import { expectType } from 'tsd';
import InAppBrowserMulti, {
    IABWindow,
    InAppBrowserStateEvent
} from '../../types/InAppBrowserMulti';

const ref = InAppBrowserMulti.open('https://example.com');

expectType < IABWindow > (ref);

ref.addEventListener < InAppBrowserStateEvent > ('loadstart', ev => {
    expectType < string > (ev.windowId);
    expectType < string > (ev.type);
});

// TBD: evaluate if it makes sense to cover type definition with this check
