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
    -- Task 1: Show whether the controls are available.
    available <= '0';
    -- Task 2: Let button A request a start when the controls are available.
    -- Task 3: Let either button request a start under that same condition.
    start <= '0';
end architecture;
