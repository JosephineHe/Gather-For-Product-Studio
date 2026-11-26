import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { IrionDinner, IrionProfile, IrionTwinProfile } from './IrionDinner';
import {
  BookingStat, ChoiceSummary, Footer, Masthead, MatchRing, ScoreColumn,
  RestaurantPhoto, SelectButton, Stat,
} from './components';
import {
  formatPrice, isMealId, isTwinId, matchPoints, meals, restaurant, twins,
  type Meal, type MealId, type Twin, type TwinId,
} from './restaurants';

const mealIds = Object.keys(meals).filter(isMealId);
const twinIds = Object.keys(twins).filter(isTwinId);

function Page({ title, step, back, children, footer }: {
  title: string;
  step: string;
  back?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => { document.title = `${title} · Gather`; }, [title]);

  return (
    <div className={`frame rule-guide ${step === 'Compare' ? 'irion-guide' : step === 'Restaurant' ? 'irion-cover' : 'irion-detail'}`}>
      <Masthead step={step} back={back} />
      <main id="content" tabIndex={-1}>{children}</main>
      {footer}
    </div>
  );
}

function MealNavigation({ meal, page }: { meal: MealId; page: 'profile' | 'twins' }) {
  return (
    <nav className="meal-nav" aria-label={page === 'profile' ? 'Restaurant menus' : 'Compare by meal'}>
      {mealIds.map((id) => (
        <NavLink
          key={id}
          className="meal-link"
          aria-current={meal === id ? 'page' : undefined}
          to={page === 'twins' ? `/twins/${id}` : id === 'brunch' ? '/rule-of-thirds' : '/dinner'}
          end
        >
          {meals[id].label}
        </NavLink>
      ))}
    </nav>
  );
}

function ProfilePage({ meal }: { meal: MealId }) {
  const menu: Meal = meals[meal];

  return (
    <Page title={restaurant.name} step="Restaurant" footer={
      <Footer>
        <Link className="primary" to={`/twins/${meal}`}>
          Explore {menu.label} Twins <ArrowRight aria-hidden="true" />
        </Link>
      </Footer>
    }>
      <nav className="restaurant-switch" aria-label="Restaurant guides"><Link to="/">IRION</Link><span aria-current="page">Rule of Thirds</span><a href="/Gather_Atomix_Restaurant_Twins.html">Atomix</a></nav>
      <section className="cover-story">
        <div className="cover-heading"><h1>Rule of Thirds</h1></div>
        <div className="cover-photo"><RestaurantPhoto photo={restaurant.photo} kind="hero-photo" /><span className="area-sticker">Greenpoint</span></div>
        <p className="cover-address">{restaurant.address}</p><p>{restaurant.description}</p>
      </section>
      <MealNavigation meal={meal} page="profile" />
      <div className="stats">
        <Stat label="Estimated per person" value={formatPrice(menu.price)} detail={menu.hours} />
        <BookingStat booking={menu.booking} />
      </div>
      <section className="section">
        <h2>{menu.label} highlights</h2>
        <DishHighlights key={meal} meal={meal} />
        <p className="footnote"><a href={restaurant.menu} target="_blank" rel="noopener noreferrer">View the Rule of Thirds menu</a></p>
      </section>
    </Page>
  );
}

const shortLabels = {
  brunch: ['Hottokeki', 'Karaage', 'Katsu sando', 'Gyudon', 'Breakfast set'],
  dinner: ['Karaage', 'Silken tofu', 'Onigiri', 'Meatball', 'Tonkatsu'],
};

function DishHighlights({ meal }: { meal: MealId }) {
  const [active, setActive] = useState<number | null>(null);
  const dishes: Meal['dishes'] = meals[meal].dishes;
  const chosen = active === null ? null : dishes[active];
  return <>
    <div className="dish-cloud" role="group" aria-label="Menu highlights">{dishes.map((dish, index) =>
      <button key={dish.name} className="dish-bubble" aria-expanded={index === active} aria-controls="rule-dish"
        onClick={() => setActive(index === active ? null : index)}>
        {dish.photo && <img className="bubble-sticker rule-sticker" src={dish.photo.url} alt="" />}
        <strong>{shortLabels[meal][index]}</strong>{dish.price !== undefined && <span className="bubble-price">{formatPrice(dish.price)}</span>}
      </button>)}</div>
    <div id="rule-dish" aria-live="polite">{chosen && <article className="dish-ticket" key={chosen.name}><div>
      <h3>{chosen.name}</h3><p>{chosen.description}</p>{chosen.photo && <RestaurantPhoto photo={chosen.photo} kind="dish-photo" />}
    </div></article>}</div>
  </>;
}

function TwinCard({ id, rank }: { id: TwinId; rank: number }) {
  const twin: Twin = twins[id];
  const { total } = matchPoints(twin);

  return (
    <article className="card" data-tone={twin.tone}>
      <Link className="card-top" to={`/twins/${twin.meal}/${id}`}>

        <div>
          <span className="label">Twin {rank}</span>
          <h2>{twin.name}</h2>
        </div>
        <MatchRing score={total} />
      </Link>
      <RestaurantPhoto photo={twin.photo} kind="hero-photo" />
      <div className="card-info">
        <span><small>Estimated per person</small><strong>{formatPrice(twin.price)}</strong></span>
        <span>
          <small>{twin.booking.opening ? 'Table for two observed' : 'Reservations'}</small>
          <strong><a href={twin.booking.url} target="_blank" rel="noopener noreferrer">
            {twin.booking.opening ?? (twin.booking.platform === 'Softbite' ? 'Contact Softbite' : `Check ${twin.booking.platform}`)}
          </a></strong>
        </span>
      </div>
      {twin.affiliation && <p className="card-affiliation"><span className="label">Same restaurant group</span></p>}
      <details className="card-breakdown">
        <summary>Why this {total}% match?</summary>
        <MatchVisual twin={twin} />
      </details>
      <Link className="card-more" to={`/twins/${twin.meal}/${id}`} aria-label={`View ${twin.name} match details`}>
        View match details <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

function OverviewPage({ meal }: { meal: MealId }) {
  const menu = meals[meal];
  const ranked = twinIds
    .filter((id) => twins[id].meal === meal)
    .sort((a, b) => matchPoints(twins[b]).total - matchPoints(twins[a]).total);

  return (
    <Page title={`${menu.label} Twins`} step="Compare" back={meal === 'brunch' ? '/rule-of-thirds' : '/dinner'}>
      <div className="intro">
        <span className="eyebrow">Alternatives to {restaurant.name}</span>
        <h1>{menu.label} Twins</h1>
        <p>Compare dishes, estimated prices and atmosphere for the same meal.</p>
      </div>
      <MealNavigation meal={meal} page="twins" />
      <div className="cards">
        {ranked.map((id, index) => <TwinCard id={id} rank={index + 1} key={id} />)}
      </div>
      <ChoiceSummary meal={meal} allowReset />
      {meal === 'dinner' && <p className="footnote">Dinner times were observed Nov. 10, 2026. Follow the booking links for current availability.</p>}
    </Page>
  );
}

function MatchVisual({ twin }: { twin: Twin }) {
  const points = matchPoints(twin);
  const factors = [
    { name: 'Dishes', value: points.dishes, maximum: 60, color: 'dishes' },
    { name: 'Price', value: points.price, maximum: 25, color: 'price' },
    { name: 'Atmosphere', value: points.atmosphere, maximum: 15, color: 'atmosphere' },
  ];

  return (
    <figure className="score-panel">
      <figcaption>Match breakdown · {points.total}/100</figcaption>
      <div className="score-columns">{factors.map(factor =>
        <div className="score-column" key={factor.name} data-factor={factor.name === 'Atmosphere' ? 'Location' : factor.name}>
          <ScoreColumn score={Math.round(factor.value / factor.maximum * 100)} label={factor.name} />
          <small>{factor.value}/{factor.maximum} pts</small>
        </div>)}</div>
    </figure>
  );
}

function MatchBreakdown({ twin }: { twin: Twin }) {
  const menu = meals[twin.meal];
  const points = matchPoints(twin);

  return (
    <section className="section">
      <h2>How the match adds up</h2>
      <MatchVisual twin={twin} />
      <details className="score-guide"><summary>Scoring notes and sample orders</summary><div className="items">
        <article className="item">
          <div className="dish-top"><h3>Dishes</h3><span className="dish-score">{points.dishes}/60</span></div>
          <p>Five dish comparisons.{twin.meal === 'brunch' ? ' The signature pancake is worth twice as much as each savory dish.' : ' Each dish carries the same weight.'}</p>
          <details className="price-details">
            <summary>See each dish’s contribution</summary>
            <ul className="dish-contributions">
              {twin.dishes.map((dish, index) => (
                <li key={menu.dishes[index].name}>
                  <span>{menu.dishes[index].name}</span>
                  <strong>{dish.score / 100 * menu.weights[index]} of {menu.weights[index]} points</strong>
                  <small>{dish.score}% dish match</small>
                </li>
              ))}
            </ul>
            <p>Dish points are added together and rounded to the nearest whole point.</p>
          </details>
        </article>
        <article className="item">
          <div className="dish-top"><h3>Price</h3><span className="dish-score">{points.price}/25</span></div>
          <p>{formatPrice(twin.price)} per person here and {formatPrice(menu.price)} at {restaurant.name}. A larger price gap lowers the score.</p>
          <details className="price-details">
            <summary>See the sample orders</summary>
            <p>{menu.priceMethod} Estimates exclude drinks, tax and tip.</p>
            <p><strong>{twin.name}.</strong> {twin.order}.</p>
            <p><strong>{restaurant.name}.</strong> {menu.order}.</p>
          </details>
        </article>
        <article className="item">
          <div className="dish-top"><h3>Atmosphere</h3><span className="dish-score">{points.atmosphere}/15</span></div>
          <p>{twin.atmosphereReason}</p>
        </article>
      </div>
      </details><p className="footnote">Gather estimates the match from dishes, price and atmosphere.</p>
      <details className="score-guide">
        <summary>What do the dish percentages mean?</summary>
        <p>100% means the same core dish, 75% a close preparation, 50% shared main ingredients with a different preparation, and 0% no comparable dish found on the reviewed menu.</p>
      </details>
    </section>
  );
}

function TwinPage({ id }: { id: TwinId }) {
  const twin: Twin = twins[id];
  const menu = meals[twin.meal];
  const [activeDish, setActiveDish] = useState(0);
  const dish = twin.dishes[activeDish];

  return (
    <Page title={twin.name} step="Twin details" back={`/twins/${twin.meal}`} footer={
      <Footer note={`Records your ${menu.label.toLowerCase()} study choice.`}><SelectButton id={id} /></Footer>
    }>
      <section className="hero twin-hero" data-tone={twin.tone}>
        <div>
          <span className="eyebrow">{menu.label} Twin</span>
          <h1>{twin.name}</h1>
          <p>{twin.area} · {twin.address}</p>
        </div>
        <MatchRing score={matchPoints(twin).total} />
      </section>
      {twin.affiliation && <p className="profile-description"><a className="label" href={twin.affiliation} target="_blank" rel="noopener noreferrer">Same restaurant group · Sunday Hospitality</a></p>}
      <RestaurantPhoto photo={twin.photo} kind="hero-photo" />
      <div className="stats">
        <Stat label="Estimated per person" value={formatPrice(twin.price)} detail={`Sample ${menu.label.toLowerCase()} order for two`} />
        <BookingStat booking={twin.booking} />
      </div>
      <MatchBreakdown twin={twin} />
      <section className="section">
        <h2>How the dishes compare</h2>
        <div className="score-panel dish-scores">
          <div className="score-columns">{twin.dishes.map((match, i) =>
            <button key={i} className="score-column" aria-pressed={activeDish === i} onClick={() => setActiveDish(i)}>
              <ScoreColumn score={match.score} label={shortLabels[twin.meal][i]} />
            </button>)}</div>
          <div className="dish-match-note" aria-live="polite"><small>Rule of Thirds · {menu.dishes[activeDish].name}</small>
            <h3>{dish.name || 'No comparable dish found'}</h3><p>{dish.reason}</p></div>
        </div>
      </section>
      <p className="footnote">
        NYC inspection database · CAMIS {twin.camis} · <a href={twin.menu} target="_blank" rel="noopener noreferrer">Restaurant menu</a>
      </p>
      <ChoiceSummary meal={twin.meal} />
    </Page>
  );
}

function OverviewRoute() {
  const { meal } = useParams();
  return isMealId(meal) ? <OverviewPage meal={meal} /> : <Navigate replace to="/twins/brunch" />;
}

function TwinRoute() {
  const { meal, id } = useParams();
  if (!isMealId(meal)) return <Navigate replace to="/twins/brunch" />;
  return isTwinId(id) && twins[id].meal === meal
    ? <TwinPage key={id} id={id} />
    : <Navigate replace to={`/twins/${meal}`} />;
}

export function App() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    document.getElementById('content')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<IrionProfile />} />
      <Route path="/irion/twins" element={<IrionDinner />} />
      <Route path="/irion/twins/:id" element={<IrionTwinProfile />} />
      <Route path="/rule-of-thirds" element={<ProfilePage meal="brunch" />} />
      <Route path="/dinner" element={<ProfilePage meal="dinner" />} />
      <Route path="/twins" element={<Navigate replace to="/twins/brunch" />} />
      <Route path="/twins/:meal" element={<OverviewRoute />} />
      <Route path="/twins/:meal/:id" element={<TwinRoute />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
