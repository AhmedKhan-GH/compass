library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity configurable_block is
    generic (
        WIDTH : positive := 8;
        RESET_VALUE : natural := 0
    );
    port (
        data : in std_logic_vector(WIDTH-1 downto 0);
        clear : in std_logic;
        shown : out std_logic_vector(WIDTH-1 downto 0);
        nonzero : out std_logic
    );
end entity;

architecture rtl of configurable_block is
begin
    -- Task 1. Select a configured value: implement this requirement.
    -- Task 2. Summarize the selected output: implement this requirement.
    shown <= (others => '0');
    nonzero <= '0';
end architecture;
