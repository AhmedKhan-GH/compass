library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        button_a : in std_logic;
        button_b : in std_logic;
        blocked : in std_logic;
        available : out std_logic;
        start : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Turn on the ready light when blocked is 0: implement this requirement.
    -- Task 2. Set start to 1 when button A is pressed and blocked is 0: implement this requirement.
    -- Task 3. Let either button set start to 1 when blocked is 0: implement this requirement.
    available <= '0';
    start <= '0';
end architecture;
