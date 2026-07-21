// Converts a technical reasoning-trace step into a plain, "explain like I'm 5" sentence.

const ELI5_MAP = [
  { match: /urgency/i, hit: 'This message is trying to rush you so you don\'t stop and think.', clean: 'This message is not trying to rush you.' },
  { match: /threat|suspension/i, hit: 'It threatens something bad will happen (like your account getting blocked) to scare you.', clean: 'It doesn\'t threaten you with anything bad.' },
  { match: /otp|pii/i, hit: 'It asks for a secret code or personal ID - real companies never do this!', clean: 'It doesn\'t ask for any secret codes or personal details.' },
  { match: /lottery|prize/i, hit: 'It promises you\'ve won money you never entered to win - a classic trick.', clean: 'It doesn\'t promise any surprise prize money.' },
  { match: /fee|payment requests/i, hit: 'It asks you to pay money upfront before you get anything back.', clean: 'It doesn\'t ask you to pay any upfront fee.' },
  { match: /link/i, hit: 'It has a sneaky link that hides where it really goes.', clean: 'Any links look normal and open.' },
  { match: /impersonation|sender/i, hit: 'It pretends to be from a bank or government office.', clean: 'It doesn\'t pretend to be an official organization.' },
  { match: /income/i, hit: 'It promises you can earn a lot of money for very little work - too good to be true.', clean: 'It doesn\'t promise unrealistic easy money.' },
  { match: /aspect ratio/i, hit: 'The shape of the note is stretched or squished compared to a real one.', clean: 'The note is shaped just like a real one.' },
  { match: /color histogram/i, hit: 'The colors on the note look off compared to genuine currency.', clean: 'The colors look like a real note.' },
  { match: /edge-sharpness|sharpness/i, hit: 'The fine print looks blurry, like it was photocopied instead of printed by a bank.', clean: 'The fine print looks crisp, like real currency.' },
  { match: /resolution/i, hit: 'The photo is too blurry/small to check carefully.', clean: 'The photo is clear enough to check carefully.' },
  { match: /payment scheme/i, hit: 'This isn\'t even a real payment link format.', clean: 'This is a real payment link format (UPI).' },
  { match: /payee handle/i, hit: 'The account it wants to pay isn\'t linked to any bank we recognize.', clean: 'The account belongs to a bank we recognize.' },
  { match: /payee name/i, hit: 'The name receiving the money sounds like a fake "refund department".', clean: 'The name receiving money looks like a normal shop or person.' },
  { match: /payment amount/i, hit: 'It asks for a strange tiny amount, often used to test stolen accounts.', clean: 'The amount requested looks like a normal purchase.' },
  { match: /transport security|https/i, hit: 'The website isn\'t using a secure, locked connection.', clean: 'The website uses a secure, locked connection.' },
  { match: /shortener/i, hit: 'The link is shortened so you can\'t see where it really leads.', clean: 'You can see exactly where this link leads.' },
  { match: /trusted domain/i, hit: 'This matches a website we know is official and safe.', clean: '' },
  { match: /tld reputation/i, hit: 'The website address ending is one scammers often use.', clean: 'The website address ending is a normal, common one.' },
  { match: /bait keywords/i, hit: 'The link text uses bait words like "free" or "prize" to lure you in.', clean: 'The link text doesn\'t use bait words.' },
  { match: /content format/i, hit: 'This doesn\'t look like a real payment link or website at all.', clean: 'This looks like a valid link format.' },
];

export function toEli5(step, hit) {
  const entry = ELI5_MAP.find((e) => e.match.test(step));
  if (!entry) return hit ? `Found something unusual: ${step}` : `Checked "${step}" - looks fine.`;
  const text = hit ? entry.hit : entry.clean;
  return text || (hit ? `Found something unusual: ${step}` : `Checked "${step}" - looks fine.`);
}
